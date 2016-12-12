/**
 * Created by alena on 12/12/2016.
 */

/********
 *
 * the code on this page runs carousels and nice scrolls
 * we use it on all html pages
 */


    $(document).ready(function () {
        $('#myCarousel').carousel({
            interval: 10000
        });
    });

// the scrolling script should run automatically on all pages except our main vis page
// there, we'll call is manually after all the vis are created
// this will make the scroll account for our GIANT visualizations
    if (document.title !== "Airbnb in NYC") {
        scrollSetUp();
    }

    function scrollSetUp() {
        $('#fullpage').fullpage({
            menu: false,
            lockAnchors: false,
            anchors: ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'],
            navigation: true,
            navigationPosition: 'left',
            slidesNavigation: true,
            slidesNavPosition: 'bottom',

            //Scrolling
            css3: true,
            scrollingSpeed: 700,
            autoScrolling: true,
            fitToSection: true,
            fitToSectionDelay: 1000,
            scrollBar: false,
            easing: 'easeInOutCubic',
            easingcss3: 'ease',
            loopBottom: false,
            loopTop: false,
            loopHorizontal: true,
            continuousVertical: false,
            continuousHorizontal: false,
            scrollHorizontally: false,
            interlockedSlides: false,
            dragAndMove: false,
            offsetSections: false,
            resetSliders: false,
            fadingEffect: false,
            normalScrollElements: '#element1, .element2',
            scrollOverflow: true, //!
            //scrollOverflowOptions: null,
            touchSensitivity: 15,
            normalScrollElementTouchThreshold: 5,
            bigSectionsDestination: null,

            //Accessibility
            keyboardScrolling: true,
            animateAnchor: true,
            recordHistory: true,

            //Design
            controlArrows: false,
            verticalCentered: true,
            paddingTop: '3em',
            paddingBottom: '10px',
            fixedElements: '#header, .footer',
            responsiveWidth: 1100,
            responsiveHeight: 600,
            responsiveSlides: false,

            //Custom selectors
            sectionSelector: '.section',
            slideSelector: '.demo',

            //events
            onLeave: function (index, nextIndex, direction) {
            },
            afterLoad: function (anchorLink, index) {
            },
            afterRender: function () {
            },
            afterResize: function () {
            },
            afterResponsive: function (isResponsive) {
            },
            afterSlideLoad: function (anchorLink, index, slideAnchor, slideIndex) {
            },
            onSlideLeave: function (anchorLink, index, slideIndex, direction, nextSlideIndex) {
            }
        });
    }