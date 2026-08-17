"use strict"

// ==================== SMOOTH SCROLL (LENIS) ====================

// Smooth inertial scrolling for the whole page.
// Skipped when the user prefers reduced motion.
const prefersReducedMotion = window.matchMedia(
	"(prefers-reduced-motion: reduce)",
).matches

const lenis = prefersReducedMotion
	? null
	: new Lenis({
			// Duration of one scroll gesture, in seconds
			duration: 1.3,
			// Soft exponential ease-out
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			// Smooth the mouse wheel
			smoothWheel: true,
	  })

// Drive Lenis with the animation frame loop
function lenisRaf(time) {
	lenis.raf(time)
	requestAnimationFrame(lenisRaf)
}

if (lenis) {
	requestAnimationFrame(lenisRaf)
}

// Scroll to a target with Lenis when available,
// falling back to native smooth scrolling
function smoothScrollTo(target, options = {}) {
	if (lenis) {
		lenis.scrollTo(target, options)
	} else if (typeof target === "number") {
		window.scrollTo({ top: target, behavior: "smooth" })
	} else {
		target.scrollIntoView({
			behavior: "smooth",
			block: options.block || "start",
		})
	}
}

// Offset that pins the section's bottom edge
// to the bottom of the viewport (like block: "end")
function bottomAlignOffset(target) {
	return target.offsetHeight - window.innerHeight
}

// ==================== BURGER MENU ====================

// Get <html> to manage global classes
const html = document.documentElement

// Wait for the page to fully load
// so all elements are already in the DOM
window.addEventListener("load", windowLoad)

function windowLoad() {
	// A single global click handler
	document.addEventListener("click", documentActions)

	// Header logic on scroll
	headerScroll()

	// Parallax initialization
	initParallax()

	// Section navigation initialization
	initSectionScroll()

	// Section reveal animations on scroll
	initRevealAnimations()

	// Class added after the page fully loads
	html.classList.add("loaded")
}

function documentActions(e) {
	// The element that was clicked
	const targetElement = e.target

	// If the click is on the menu icon or its child
	if (targetElement.closest(".icon-menu")) {
		// Toggle the menu state
		html.classList.toggle("menu-open")

		// Update aria-expanded for accessibility
		const isOpen = html.classList.contains("menu-open")
		const menuButton = document.querySelector(".icon-menu")
		if (menuButton) {
			menuButton.setAttribute("aria-expanded", isOpen)
		}
	}
}

// ==================== HEADER SCROLL ====================

function headerScroll() {
	const header = document.querySelector(".header")

	// If there's no header, do nothing
	if (!header) return

	function checkScroll() {
		// If the page is scrolled a bit, add the class
		if (window.scrollY > 1) {
			header.classList.add("header-scroll-state")
		} else {
			header.classList.remove("header-scroll-state")
		}
	}

	// Check on load
	checkScroll()

	// Check on scroll
	window.addEventListener("scroll", checkScroll)
}

// ==================== PARALLAX ====================

function initParallax() {
	const SELECTORS = {
		parent: "[data-prlx-parent]",
		item: "[data-prlx]",
	}

	// Find all sections with parallax
	const parents = document.querySelectorAll(SELECTORS.parent)

	// If there are no sections, exit
	if (!parents.length) return

	// Flag to optimize requestAnimationFrame calls
	let ticking = false

	function updateParallax() {
		parents.forEach((parent) => {
			// All moving elements inside the section
			const items = parent.querySelectorAll(SELECTORS.item)

			if (!items.length) return

			// Section position relative to the viewport
			const parentRect = parent.getBoundingClientRect()
			const parentHeight = parent.offsetHeight
			const parentTop = parentRect.top

			// Calculate how far the section has passed through the screen
			const rawProgress =
				(window.innerHeight - parentTop) /
				(window.innerHeight + parentHeight)

			// Clamp the value between 0 and 1
			const progress = Math.max(0, Math.min(rawProgress, 1))

			items.forEach((item) => {
				// Layer speed from the HTML attribute
				const speed = Number(item.dataset.prlxSpeed) || 5

				// Movement direction (up/down)
				const direction = Number(item.dataset.prlxDirection) || -1

				// Main offset formula
				const translateY = progress * speed * 30 * direction

				item.style.transform = `translate3d(0px, ${translateY}px, 0)`
			})
		})

		ticking = false
	}

	function requestTick() {
		// Don't start a new frame until the previous one finishes
		if (!ticking) {
			requestAnimationFrame(updateParallax)
			ticking = true
		}
	}

	// Update on scroll
	window.addEventListener("scroll", requestTick)

	// Update on window resize
	window.addEventListener("resize", requestTick)

	// Initial run
	requestTick()
}

// ==================== Scroll down ===========================

// The "scroll down" button in the hero
const scrollDownBtn = document.querySelector(".hero__btn")

// All sections involved in navigation
const sections = document.querySelectorAll("[data-section]")

// Check:
// whether the button exists
// whether there is at least one section
if (scrollDownBtn && sections.length) {
	scrollDownBtn.addEventListener("click", () => {
		// Find the current section (the one containing the button)
		const currentSection = scrollDownBtn.closest("[data-section]")

		if (!currentSection) return

		// Convert the NodeList to an array for easier index handling
		const sectionsArray = [...sections]

		// Find the index of the current section
		const currentIndex = sectionsArray.indexOf(currentSection)

		// If the section wasn't found, exit
		if (currentIndex === -1) return

		// Get the next section by index
		const nextSection = sectionsArray[currentIndex + 1]

		// If there is no next section (e.g., it's the last one), do nothing
		if (!nextSection) return

		// Smooth scroll to the next section,
		// aligning its bottom edge with the viewport bottom
		smoothScrollTo(nextSection, { offset: bottomAlignOffset(nextSection) })
	})
}

// ==================== SECTION SCROLL ====================

function initSectionScroll() {
	const SELECTORS = {
		list: ".section-nav__list",
		thumb: ".section-nav__thumb",
		button: "[data-scroll]",
		section: "[data-section]",
	}

	const CLASSNAMES = {
		active: "active",
	}

	// Section navigation list
	const navList = document.querySelector(SELECTORS.list)
	// All buttons that trigger scrolling
	const scrollButtons = document.querySelectorAll(SELECTORS.button)
	// All sections that can be navigated to
	const sections = document.querySelectorAll(SELECTORS.section)
	// The thumb on the vertical line
	const scrollThumb = document.querySelector(SELECTORS.thumb)

	// Guard:
	// if something is missing or the screen is tablet/mobile, skip the logic
	if (
		!navList ||
		!scrollThumb ||
		scrollButtons.length === 0 ||
		sections.length === 0 ||
		window.innerWidth <= 1024
	) {
		return
	}

	// -------------------- NAV CLICK --------------------

	// While a programmatic scroll is running, the thumb stays
	// on the clicked item instead of tracking section by section
	let programmaticScrollActive = false
	// Token to ignore the end of a scroll that was replaced by a newer one
	let programmaticScrollId = 0

	navList.addEventListener("click", (e) => {
		// The element that was clicked
		const targetElement = e.target

		// Find the closest button with data-scroll
		const currentButton = targetElement.closest(SELECTORS.button)

		// If the click wasn't on a nav button, exit
		if (!currentButton) return

		// Get the target section name
		const targetSection = currentButton.dataset.scroll

		// Find the target section
		const targetBlock = document.querySelector(
			`[data-section="${targetSection}"]`,
		)

		// If the section wasn't found, exit
		if (!targetBlock) return

		// Mark the active item immediately so the thumb
		// responds without waiting for the scroll to arrive
		setActiveNavItem(targetSection)

		// Freeze scroll-based tracking while the programmatic
		// scroll runs, so the thumb doesn't jump back to
		// intermediate sections during the animation
		const scrollId = ++programmaticScrollId
		programmaticScrollActive = true

		const endProgrammaticScroll = () => {
			window.removeEventListener("scrollend", endProgrammaticScroll)
			if (scrollId !== programmaticScrollId) return
			programmaticScrollActive = false
			// Re-sync with the actual position after the scroll ends
			checkActiveSection()
		}

		// Lenis dispatches its own "scrollend" DOM event on
		// window when the programmatic scroll finishes; without
		// Lenis (reduced motion) the native scrollend fires.
		window.addEventListener("scrollend", endProgrammaticScroll)
		// Safety net for browsers without scrollend support
		setTimeout(endProgrammaticScroll, 1500)

		// If it's the hero, scroll back to the very top
		if (targetSection === "hero") {
			smoothScrollTo(0)
		} else {
			// For other sections, smooth scroll to the block
			smoothScrollTo(targetBlock, {
				offset: bottomAlignOffset(targetBlock),
			})
		}
	})

	// -------------------- ACTIVE NAV ITEM --------------------

	function setActiveNavItem(currentSection) {
		// First, remove active from all buttons
		scrollButtons.forEach((button) => {
			button.classList.remove(CLASSNAMES.active)
		})

		// Find the button matching the active section
		const currentActiveButton = [...scrollButtons].find(
			(button) => button.dataset.scroll === currentSection,
		)

		// If the button wasn't found, exit
		if (!currentActiveButton) return

		// Add active to the matching button
		currentActiveButton.classList.add(CLASSNAMES.active)

		// -------------------- THUMB MOVEMENT --------------------

		// Button offset from the top of its container
		const buttonTop = currentActiveButton.offsetTop

		// Button height
		const buttonHeight = currentActiveButton.offsetHeight

		// Thumb height
		const thumbHeight = scrollThumb.offsetHeight

		// Center the thumb on the active button
		const thumbPosition = buttonTop + buttonHeight / 2 - thumbHeight / 2

		// Move the thumb vertically
		scrollThumb.style.transform = `translateY(${thumbPosition}px)`
	}

	// -------------------- DETECT ACTIVE SECTION ON SCROLL --------------------

	function checkActiveSection() {
		// While a programmatic scroll is running, the thumb
		// already sits on the clicked item — skip the tracking
		if (programmaticScrollActive) return

		// Control line — the middle of the screen
		const controlPoint = window.innerHeight / 2

		// Iterate over all sections
		for (const section of sections) {
			// Section position relative to the viewport
			const rect = section.getBoundingClientRect()

			// If the control point is inside the section
			if (rect.top <= controlPoint && rect.bottom >= controlPoint) {
				// Get the current section name
				const currentSection = section.dataset.section

				// Update the active nav item
				setActiveNavItem(currentSection)

				// No need to keep searching
				break
			}
		}
	}

	// Initial run on load
	checkActiveSection()

	// Update on scroll
	window.addEventListener("scroll", checkActiveSection)
}

// ==================== REVEAL ANIMATIONS ====================

function initRevealAnimations() {
	// Select all sections that will animate on reveal
	const sections = document.querySelectorAll("[data-section]")

	// If there are no sections or IntersectionObserver is unsupported
	if (!sections.length || !("IntersectionObserver" in window)) return

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					// Add the class for the CSS animation
					entry.target.classList.add("section--visible")
					// Unobserve — animate only once
					observer.unobserve(entry.target)
				}
			})
		},
		{
			threshold: 0.15,
			rootMargin: "0px 0px -50px 0px",
		},
	)

	sections.forEach((section) => observer.observe(section))
}
