(function (global) {

var TAB_ANIMATION_SPEED = 250; 
var tabAnimationsRunning = 0;

global.TabSet= function () {
  this.init();
  this.lastHintPosition = false;
};

global.TabSet.prototype = {

  init: function () {
    this.attachEvents();
  },

  /**
   * Calculates area and position information per each tab and puts it
   * into an object for use in calculating if its moused over or not.
   * Since elementFromPoint, mouseover, mouseenter do not seem to work
   * in this scenario... mouseover seems like it should work?
   */
  getTabAreas: function () {
    var tabElements = jQuery('.tab');
    var tabAreas = [],
        element,
        offset,
        /* // Not needed at the moment.
        bottom,
        top,
        height,
        */
        left,
        right,
        width;

    for (var i = 0; i < tabElements.length; i++) {
      element = jQuery(tabElements[i])
      offset = element.offset();

      width = element.outerWidth();
      /* // not needed at the moment.
      height = element.outerHeight();
      */

      left = offset.left;
      right = offset.left + width;
      /* // Not needed at the moment.
      top = offset.top;
      bottom = offset.top + height;
      */

      tabAreas.push({
        element: tabElements[i],
        /* // not needed at the moment.
        height: height,
        top: top,
        bottom: bottom,
        middleY: Math.floor(top + (height / 2)),
        */
        width: width,
        left: left,
        right: right,
        middleX: Math.floor(left + (width / 2))
      });
    }

    return tabAreas;
  },

  /**
   * Creates a draggable element that will follow the cursor. It copies
   * the element, and inserts it outside of its context and absolutely
   * positions it at the current cursor position.
   */
  createDraggableElement: function (x, y, element) {

    var elementCopy,
        elementCopyStyle;

    elementCopy = jQuery(element).clone();

    elementCopy.appendTo(document.body);

    elementCopyStyle = elementCopy[0].style;

    elementCopyStyle.position ='absolute';
    elementCopyStyle.zIndex = '1';
    elementCopyStyle.left = x + 'px';

    elementCopy.addClass('dragging');

    return elementCopy;
  },

  /**
   * Given an element, get the main tab element associated with the element.
   * It could be the tab element, or the element its self.
   */
  getTabElement: function (target) {
    var tabElement;

    if (target) {
      tabElement = (target.className.indexOf('tab') == -1) ? target.parentNode : target;
      this.tabElement = tabElement;
    }
    else if (this.tabElement){
      tabElement =  this.tabElement;
    }
    else{
      console.error('could not get tab element.');
    }
    return jQuery(tabElement);
  },

  /**
   * Determines if the element is a tab.
   */
  isTabElement: function (element) {
    var tabElement = false;
    element = jQuery(element);
    if (element.hasClass('tab')) {
      tabElement = true;
    }
    if (element.parent().hasClass('tab')) {
      tabElement = true;
    }
    return tabElement;
  },

  /**
   * Determine where the new tab position should be given the x, y (mouse
   * position)
   * @todo, the params for this function is ghetto
   */
  gettabDestinationPos: function (cursorPositionRelativeToTabContainer, tabAreas, tabElement) {

    var tabArea,
        tabAreaLen = tabAreas.length,
        position = false,
        posX = cursorPositionRelativeToTabContainer;

    for (var i = 0; i < tabAreaLen; i++) {
      tabArea = tabAreas[i];


      if (posX > tabArea.left &&  /* The mouse is to the right of the left of the tab AND */
          (
            /* Either: */

            tabAreas[i + 1] && /* Theres a tab to the right AND */
            posX <= tabAreas[i + 1].left /* The mouse is to the left of the left position of the tab on the right. */

             || /* OR */

            !tabAreas[i + 1] && /* There is no tab to the right AND */
            posX <= tabAreas[i].right /* But the mouse is still to the left of the right position of the tab */
          )
      ) {

        // The mouse is towards the RIGHT of the tab.
        if (posX > tabArea.middleX && tabElement !== tabArea.element) {
          position = i + 1;
        }
        // The mouse is towards the LEFT of the tab.
        else {
          position = i;
        }

        // If the position is past the end of where it should be.
        if (i > tabAreaLen - 2) {
          // put it at the last position
          position = tabAreaLen - 2;
        }

        return position;

      }

    }

    return position;

  },

  /**
   * When we are done dragging we need to "drop" the tab element in the
   * new position, inserting it into the DOM.
   */
  insertTabElementAtPosition: function (tabElement, position, tabElementWrapper) {
    var tabElementDestination,
        tabs = tabElementWrapper.find('.tab');


    if (position !== 0) {
      tabElementDestination = tabs.eq(position - 1);
      // Inserts the placeholder after the specified position
      tabElement.insertAfter(tabElementDestination);
    }
     // Special case for when the position is zero.
    else {
      tabElementDestination = tabs.eq(position);
      // Inserts the placeholder before the specified position
      tabElement.insertBefore(tabElementDestination);
    }

    return tabElement;
  },

  createPlaceHolder: function () {
    return jQuery('<div class="placeHolder"></div>');
  },

  animateShyTabLeft: function (shyTab) {

    var shyTabWidth = shyTab.outerWidth();

    // instantly position the tab to the right of where it should be. So then
    // it can animate to its desired position.
    shyTab.css({
      position: 'relative',
      left: shyTabWidth
    });

    tabAnimationsRunning++;

    shyTab.animate(
      // Animate the tab to its normal desired position.
      {left:0},

      // The speed of the animation is determined by how many animations are
      // running, for every animation running decrease the speed by an eight.
      TAB_ANIMATION_SPEED - (tabAnimationsRunning * (TAB_ANIMATION_SPEED / 8)),

      // The animation is complete.
      function () {
        // we are running one less animation.
        tabAnimationsRunning--;
      }
    );

  },

  animateShyTabRight: function (shyTab) {

    var shyTabWidth = shyTab.outerWidth();

    // instantly position the tab to the right of where it should be. So then
    // it can animate to its desired position.
    shyTab.css({
      position: 'relative',
      left: shyTabWidth * -1
    });

    tabAnimationsRunning++;

    shyTab.animate(
      // Animate the tab to its normal desired position.
      {left:  0},

      // The speed of the animation is determined by how many animations are
      // running, for every animation running decrease the speed by an eight.
      TAB_ANIMATION_SPEED - (tabAnimationsRunning * (TAB_ANIMATION_SPEED / 8)),

      // The animation is complete.
      function () {
        // we are running one less animation.
        tabAnimationsRunning--;
      }
    );

  },

  /**
   * Provides a visual hint at the position the tab is to be inserted.
   *
   * Displays an the empty slot that visually pushes tabs, given a position
   * it will insert the slot and animate the tab that needs to be pushed over.
   */
  showDestinationHintAtPosition: function (position, tabElementWrapper) {

    var tabElement,
        tabs = tabElementWrapper.find('.tab'),
        destinationHint = this.createPlaceHolder(),
        lastHintPosition = this.lastHintPosition,
        shouldAnimateShyTab,
        shyTab,
        tabGoingInDirection;

    // Remove any previous destination hints.
    this.removeDestinationHint(tabElementWrapper);

    if (lastHintPosition !== false) {
      if (lastHintPosition == undefined || lastHintPosition === position) {
        lastHintPosition = false;
        shouldAnimateShyTab = false;
      }
      else if (position < lastHintPosition) {
        shyTab = tabs.eq(position);
        shouldAnimateShyTab = true
        tabGoingInDirection = 'left';
      }
      else if (position > lastHintPosition) {
        shyTab = tabs.eq(position - 1);
        shouldAnimateShyTab = true;
        tabGoingInDirection = 'right';
      }
    }
    else {
      shouldAnimateShyTab = false;
    }

    if (position !== 0) {
      tabElement = tabs.eq(position - 1);

      // Inserts the placeholder after the specified position
      destinationHint.insertAfter(tabElement);
    }
     // Special case for when the position is zero.
    else {
      tabElement = tabs.eq(position);

      // Inserts the placeholder before the specified position
      destinationHint.insertBefore(tabElement);
    }

    if (shouldAnimateShyTab) {
      // Tab is going left
      if (tabGoingInDirection == 'left') {
        this.animateShyTabRight(shyTab);
      }
      // Tab is going right
      else {
        this.animateShyTabLeft(shyTab);
      }

    }

    this.lastHintPosition = position;

  },

  getTabElementPosition: function (tabElement) {
    var wrapper = tabElement.parents('.tabs:first').find('.tab');
    return wrapper.index(tabElement);
  },

  /**
   * Removes any previous destination hints.
   */
  removeDestinationHint: function (scope) {
    scope = scope || document.body;

    jQuery(scope).find('.placeHolder').remove();
  },

  scrollToVisibleTab: function (tabSet , direction) {

    nextOrPrev = (direction == 'left') ? 'prev' : 'next';

    var tabs = tabSet.find('.tab');

    var tabScroller = tabSet.find('.tabScroller:first');

    var tabScrollerWidth = tabScroller.width();

    var tab,
        tabRightPos,
        lastFullyVisibleTab;

    for (var i = 0; i < tabs.length; i++) {

      tab = jQuery(tabs[i]);

      tabRightPos = tab.position().left + tab.width();

      if (tabRightPos < tabScrollerWidth) {
        lastFullyVisibleTab = tab;
      }

    }

    var nextTab = lastFullyVisibleTab[nextOrPrev]();

    if (nextTab.length) {
      var nextTabPosLeft = nextTab.position().left;
      var nextTabPaddingLeft = parseInt(nextTab.css('padding-left'));
      var nextTabPaddingRight = parseInt(nextTab.css('padding-right'));
      var nextTabWidth = nextTab.width() + nextTabPaddingLeft + nextTabPaddingRight;
      var unvisibleTabPixelsToRight = nextTabWidth - (tabScrollerWidth - nextTabPosLeft);
      tabScroller.animate({scrollLeft: "+=" + unvisibleTabPixelsToRight});
    }

  },

  attachEvents: function () {

    var self = this;

    jQuery('.scrollRight').bind('click', function (e) {
      var tabSet = jQuery(e.target).parents('.tabs:first');
      self.scrollToVisibleTab(tabSet, 'right');
      e.preventDefault();
    });

    jQuery('.scrollLeft').bind('click', function (e) {
      var tabSet = jQuery(e.target).parents('.tabs:first');
      self.scrollToVisibleTab(tabSet, 'left');
      e.preventDefault();
    });

    jQuery(document).bind('mousedown', function (eMouseDown) {

      var mouseDownTarget = eMouseDown.target;

      // If its not a tab element, skip it
      if (!self.isTabElement(mouseDownTarget)){
        return false;
      }

      // Its not a left click, skip it
      if (eMouseDown.which !== 1) {
        return false;
      }

      var startedDragging = false;

      // Get the main tab element from the target. (may be an element inside of the tab)
      var tabElement = self.getTabElement(eMouseDown.target),

          tabElementWrapper = tabElement.parents('.tabs:first'),

          // Shortcuts
          mouseDownX = eMouseDown.clientX,

          mouseDownY = eMouseDown.clientY,

          // Create a draggable element, which will follow the cursor as user drags.
          draggableElement = self.createDraggableElement(mouseDownX, mouseDownY, tabElement),

          // position information per each tab
          tabAreas = self.getTabAreas(),

          tabOffsetLeft = tabElement.offset().left,

          cursorPositionRelativeToTab =  (tabElement.outerWidth() / 2) - ((tabElement.outerWidth() / 2) - (mouseDownX - tabOffsetLeft));

          var blah = mouseDownX - tabElementWrapper.offset().left;

          // According to the current mouse position, where should the tab go?
          var tabDestinationPos = self.gettabDestinationPos(mouseDownX, tabAreas, tabElement[0]);

          // While dragging the tab around, what was the last calculated destination position?
          var lasttabDestinationPos = tabDestinationPos,

          /** @todo: last hint position */

          elementMarginLeft = parseInt(tabElement.css('margin-left')),

          tabElementPosition = self.getTabElementPosition(tabElement),

          offsetLeft = mouseDownX - tabOffsetLeft + elementMarginLeft;


      tabElement.after(self.createPlaceHolder());

      tabElement.remove();

      // Move the draggable Element along with the cursor x position.
      draggableElement[0].style.left = (mouseDownX - offsetLeft) + 'px';

      /**
       * On Mouse Move.
       */
      var dragTab = function (eMouseMove) {

        if (!startedDragging) {
//                if (Math.abs(eMouseMove.clientX - eMouseDown.clientX) > TAB_MOVE_STICKYNESS  || Math.abs(eMouseMove.y - eMouseDown.y) > TAB_MOVE_STICKYNESS) {
            startedDragging = true;
//                }
        }
        else {

          var mouseMoveX = eMouseMove.clientX,
              mouseMoveY = eMouseMove.clientY;

          // @TODO: var cursorPositionRelativeToTabContainer = mouseMoveX - cursorPositionRelativeToTab

           var cursorPositionRelativeToTabContainer = mouseMoveX - cursorPositionRelativeToTab

          // Determine where the new tab position should be according to the cursor position.
          tabDestinationPos = self.gettabDestinationPos(cursorPositionRelativeToTabContainer, tabAreas, eMouseMove.target);

          // If the mouse isn't over a tab position, find out where it should go. @TODO: move to this.gettabDestinationPos func
          if (tabDestinationPos === false) {
            // If its to the right of the last tab.
            if (mouseMoveX - cursorPositionRelativeToTab > tabAreas[tabAreas.length - 1].left) {
              // its at the last position.
              tabDestinationPos = tabAreas.length - 2;
            }
            // If its to the left of the first tab.
            else if (mouseMoveX - cursorPositionRelativeToTab < tabAreas[0].left){
              tabDestinationPos = 0; // its at the first position
            }
          }

          // If we have a destination, and it is different than what the last destination was.
          if (tabDestinationPos !== false && tabDestinationPos !== lasttabDestinationPos) {

            self.showDestinationHintAtPosition(tabDestinationPos, tabElementWrapper);

            // notate what the last destination position was so we can figure
            // out when we have moved to a new destination position
            lasttabDestinationPos = tabDestinationPos;
          }

          // Move the draggable Element along with the cursor x position.
          draggableElement[0].style.left = (mouseMoveX - offsetLeft) + 'px';

        }

      };

      /**
       * On Mouse Up.
       */
      var dropTab = function (eMouseUp) {

        lasttabDestinationPos = tabDestinationPos;

        self.insertTabElementAtPosition(tabElement, tabDestinationPos, tabElementWrapper);

        self.removeDestinationHint(tabElementWrapper);

        draggableElement.remove();

      };

      // Run the above dragTab function when the mouse moves.
      jQuery(document).bind('mousemove', dragTab);

      // Run the above dropTab function when the mouse is up.
      jQuery(document).bind('mouseup', function _dropTab(eMouseUp) {
        dropTab.call(self,eMouseUp);
        // Unbind Stuff so that it doesn't get re-bound every time the mouse goes down.
        jQuery(document).unbind('mousemove', dragTab); // Unbind mousemove.
        jQuery(document).unbind('mouseup', _dropTab); // Unbind the current function.
      });

    });

  }

      };

}(this));


jQuery(document).ready(function () {

  var tabSet = new TabSet('.tabs:first');

});
