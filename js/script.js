"use strict"

// ==================== BURGER MENU ====================

// Отримуємо <html> для керування глобальними класами
const html = document.documentElement

// Чекаємо повного завантаження сторінки,
// щоб усі елементи вже були в DOM
window.addEventListener("load", windowLoad)

function windowLoad() {
	// Один глобальний обробник кліку
	document.addEventListener("click", documentActions)

	// Логіка шапки при скролі
	headerScroll()

	// Ініціалізація паралаксу
	initParallax()

	// Ініціалізація навігації по секціях
	initSectionScroll()

	// Анімація появи секцій при скролі
	initRevealAnimations()

	// Клас після повного завантаження сторінки
	html.classList.add("loaded")
}

function documentActions(e) {
	// Елемент, по якому був клік
	const targetElement = e.target

	// Якщо клік по іконці меню або її дочірньому елементу
	if (targetElement.closest(".icon-menu")) {
		// Перемикаємо стан меню
		html.classList.toggle("menu-open")

		// Оновлюємо aria-expanded для accessibility
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

	// Якщо шапки немає — нічого не робимо
	if (!header) return

	function checkScroll() {
		// Якщо сторінка трохи проскролена — додаємо клас
		if (window.scrollY > 1) {
			header.classList.add("header-scroll-state")
		} else {
			header.classList.remove("header-scroll-state")
		}
	}

	// Перевірка при завантаженні
	checkScroll()

	// Перевірка при скролі
	window.addEventListener("scroll", checkScroll)
}

// ==================== PARALLAX ====================

function initParallax() {
	const SELECTORS = {
		parent: "[data-prlx-parent]",
		item: "[data-prlx]",
	}

	// Знаходимо всі секції з паралаксом
	const parents = document.querySelectorAll(SELECTORS.parent)

	// Якщо немає жодної секції — виходимо
	if (!parents.length) return

	// Прапорець для оптимізації requestAnimationFrame
	let ticking = false

	function updateParallax() {
		parents.forEach((parent) => {
			// Усі рухомі елементи всередині секції
			const items = parent.querySelectorAll(SELECTORS.item)

			if (!items.length) return

			// Положення секції відносно viewport
			const parentRect = parent.getBoundingClientRect()
			const parentHeight = parent.offsetHeight
			const parentTop = parentRect.top

			// Рахуємо прогрес проходження секції через екран
			const rawProgress =
				(window.innerHeight - parentTop) /
				(window.innerHeight + parentHeight)

			// Обмежуємо значення в межах 0...1
			const progress = Math.max(0, Math.min(rawProgress, 1))

			items.forEach((item) => {
				// Швидкість руху шару з HTML
				const speed = Number(item.dataset.prlxSpeed) || 5

				// Напрям руху (вгору/вниз)
				const direction = Number(item.dataset.prlxDirection) || -1

				// Основна формула зсуву
				const translateY = progress * speed * 30 * direction

				item.style.transform = `translate3d(0px, ${translateY}px, 0)`
			})
		})

		ticking = false
	}

	function requestTick() {
		// Не запускаємо новий кадр, поки не завершився попередній
		if (!ticking) {
			requestAnimationFrame(updateParallax)
			ticking = true
		}
	}

	// Оновлення при скролі
	window.addEventListener("scroll", requestTick)

	// Оновлення при зміні розміру вікна
	window.addEventListener("resize", requestTick)

	// Перший запуск
	requestTick()
}

// ==================== Scroll down ===========================

// Кнопка "scroll down" в hero
const scrollDownBtn = document.querySelector(".hero__btn")

// Усі секції, які беруть участь у навігації
const sections = document.querySelectorAll("[data-section]")

// Перевірка:
// чи існує кнопка
// чи є хоча б одна секція
if (scrollDownBtn && sections.length) {
	scrollDownBtn.addEventListener("click", () => {
		// Знаходимо поточну секцію (в якій знаходиться кнопка)
		const currentSection = scrollDownBtn.closest("[data-section]")

		if (!currentSection) return

		// Перетворюємо NodeList в масив для зручної роботи з індексами
		const sectionsArray = [...sections]

		// Знаходимо індекс поточної секції
		const currentIndex = sectionsArray.indexOf(currentSection)

		// Якщо секцію не знайдено — виходимо
		if (currentIndex === -1) return

		// Отримуємо наступну секцію по індексу
		const nextSection = sectionsArray[currentIndex + 1]

		// Якщо наступної секції нема (наприклад, остання) — нічого не робимо
		if (!nextSection) return

		// Плавний скрол до наступної секції
		nextSection.scrollIntoView({
			behavior: "smooth",
			block: "end", // вирівнюємо секцію по нижньому краю viewport
		})
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

	// Список навігації по секціях
	const navList = document.querySelector(SELECTORS.list)
	// Усі кнопки, які запускають скрол
	const scrollButtons = document.querySelectorAll(SELECTORS.button)
	// Усі секції, до яких можна перейти
	const sections = document.querySelectorAll(SELECTORS.section)
	// Повзунок на вертикальній лінії
	const scrollThumb = document.querySelector(SELECTORS.thumb)

	// Захист:
	// якщо чогось немає або екран планшетний/мобільний — логіку не запускаємо
	if (
		!navList ||
		!scrollThumb ||
		scrollButtons.length === 0 ||
		sections.length === 0 ||
		window.innerWidth <= 1024
	) {
		return
	}

	// -------------------- КЛІК ПО НАВІГАЦІЇ --------------------

	navList.addEventListener("click", (e) => {
		// Елемент, по якому був клік
		const targetElement = e.target

		// Шукаємо найближчу кнопку з data-scroll
		const currentButton = targetElement.closest(SELECTORS.button)

		// Якщо клік був не по кнопці навігації — виходимо
		if (!currentButton) return

		// Отримуємо назву цільової секції
		const targetSection = currentButton.dataset.scroll

		// Знаходимо потрібну секцію
		const targetBlock = document.querySelector(
			`[data-section="${targetSection}"]`,
		)

		// Якщо секцію не знайдено — виходимо
		if (!targetBlock) return

		// Якщо hero — повертаємось у самий верх сторінки
		if (targetSection === "hero") {
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			})
		} else {
			// Для інших секцій — плавний перехід до блоку
			targetBlock.scrollIntoView({
				behavior: "smooth",
				block: "end",
			})
		}
	})

	// -------------------- АКТИВНИЙ ПУНКТ НАВІГАЦІЇ --------------------

	function setActiveNavItem(currentSection) {
		// Спочатку прибираємо active з усіх кнопок
		scrollButtons.forEach((button) => {
			button.classList.remove(CLASSNAMES.active)
		})

		// Шукаємо кнопку, яка відповідає активній секції
		const currentActiveButton = [...scrollButtons].find(
			(button) => button.dataset.scroll === currentSection,
		)

		// Якщо кнопку не знайдено — виходимо
		if (!currentActiveButton) return

		// Додаємо active потрібній кнопці
		currentActiveButton.classList.add(CLASSNAMES.active)

		// -------------------- РУХ ПОВЗУНКА --------------------

		// Відстань кнопки від верхнього краю її контейнера
		const buttonTop = currentActiveButton.offsetTop

		// Висота кнопки
		const buttonHeight = currentActiveButton.offsetHeight

		// Висота самого повзунка
		const thumbHeight = scrollThumb.offsetHeight

		// Ставимо повзунок по центру активної кнопки
		const thumbPosition = buttonTop + buttonHeight / 2 - thumbHeight / 2

		// Рухаєм повзунок по вертикалі
		scrollThumb.style.transform = `translateY(${thumbPosition}px)`
	}

	// -------------------- ВИЗНАЧЕННЯ АКТИВНОЇ СЕКЦІЇ ПРИ СКРОЛІ --------------------

	function checkActiveSection() {
		// Контрольна лінія — верхня третина екрана
		const controlPoint = window.innerHeight / 2

		// Проходимо по всіх секціях
		for (const section of sections) {
			// Положення секції відносно viewport
			const rect = section.getBoundingClientRect()

			// Якщо контрольна точка знаходиться всередині секції
			if (rect.top <= controlPoint && rect.bottom >= controlPoint) {
				// Отримуємо назву поточної секції
				const currentSection = section.dataset.section

				// Оновлюємо активний пункт навігації
				setActiveNavItem(currentSection)

				// Далі шукати не потрібно
				break
			}
		}
	}

	// Перший запуск при завантаженні
	checkActiveSection()

	// Оновлення при скролі
	window.addEventListener("scroll", checkActiveSection)
}

// ==================== REVEAL ANIMATIONS ====================

function initRevealAnimations() {
	// Обираємо всі секції, які будуть анімовані при появі
	const sections = document.querySelectorAll("[data-section]")

	// Якщо секцій нема або IntersectionObserver не підтримується
	if (!sections.length || !("IntersectionObserver" in window)) return

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					// Додаємо клас для CSS-анімації
					entry.target.classList.add("section--visible")
					// Відписуємось — анімуємо тільки один раз
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
