(function (global) {

var TAB_ANIMATION_SPEED = 250; 
var tabAnimationsRunning = 0;

global.TabCollectionDragger = function (tabSelector, tabContainerSelector) {
  this.attachEvents();
  this.lastHintPosition = false;
  this.tabSelector = tabSelector || '.tab'; // The "Tab" Element
  this.tabContainerSelector = tabContainerSelector || '.tabs'; // Element Contains a series of "Tab" Elements
};

global.TabCollectionDragger.prototype = {

  /**
   * Calculates area and position information per each tab and puts it
   * into an object for use in calculating if its moused over or not.
   * Since elementFromPoint, mouseover, mouseenter do not seem to work
   * in this scenario... mouseover seems like it should work?
   */
  getTabAreas: function () {
    var tabElements = jQuery(this.tabSelector);
    var tabAreas = [],
        element,
        offset,
        left,
        right,
        width;

    for (var i = 0; i < tabElements.length; i++) {
      element = jQuery(tabElements[i])
      offset = element.offset();

      width = element.outerWidth();

      left = offset.left;
      right = offset.left + width;

      tabAreas.push({
        element: tabElements[i],
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

    elementCopy.addClass('tabDragging');

    return elementCopy;
  },

  /**
   * Given an element, get the main tab element associated with the element.
   * It could be the tab element, or the element its self.
   */
  getTabElement: function (target) {
    var tabElement;

    if (target) {

      if (jQuery(target).is(this.tabSelector)) {
        tabElement = jQuery(target);
      }
      else {
        tabElement = jQuery(target).parents(this.tabSelector).first();
      }

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
    if (element.is(this.tabSelector)) {
      tabElement = true;
    }
    if (element.parents(this.tabSelector).length > 0) {
      tabElement = true;
    }

    return tabElement;
  },

  /**
   * Determine where the new tab position should be given the x, y (mouse
   * position)
   * @todo, the params for this function is ghetto
   */
  getTabDestinationPos: function (cursorPositionRelativeToTabContainer, tabAreas, tabElement) {

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
  insertTabElementAtPosition: function (tabElement, position, tabContainerElement) {
    var tabElementDestination,
        tabs = tabContainerElement.find(this.tabSelector);


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
  showDestinationHintAtPosition: function (position, tabContainerElement) {

    var tabElement,
        tabs = tabContainerElement.find(this.tabSelector),
        destinationHint = this.createPlaceHolder(),
        lastHintPosition = this.lastHintPosition,
        shouldAnimateShyTab,
        shyTab,
        tabGoingInDirection;

    // Remove any previous destination hints.
    this.removeDestinationHint(tabContainerElement);

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
    var wrapper = tabElement.parents(this.tabContainerSelector).first().find(this.tabSelector);
    return wrapper.index(tabElement);
  },

  /**
   * Removes any previous destination hints.
   */
  removeDestinationHint: function (scope) {
    scope = scope || document.body;

    jQuery(scope).find('.placeHolder').remove();
  },


  attachEvents: function () {

    var self = this;

    jQuery(document).bind('mousedown', function (eMouseDown) {

      mouseDownTarget = eMouseDown.target;

      // If its not a tab element, skip it
      if (!self.isTabElement(mouseDownTarget)){
        return false;
      }

      // Its not a left click, skip it
      if (eMouseDown.which !== 1) {
        return false;
      }

      var tabElement = self.getTabElement(mouseDownTarget);
      var tabContainerElement = tabElement.parents(self.tabContainerSelector).first();
      var tabs = tabContainerElement.find(self.tabSelector);

      tabs.removeClass('active');

      tabs.css('z-index', 1);

      tabElement.addClass('active');
      tabElement.css('z-index', 2);


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

          tabContainerElement = tabElement.parents(this.tabContainerSelector).first(),

          // Shortcuts
          mouseDownX = eMouseDown.clientX,

          mouseDownY = eMouseDown.clientY,

          // Create a draggable element, which will follow the cursor as user drags.
          draggableElement = self.createDraggableElement(mouseDownX, mouseDownY, tabElement),

          // position information per each tab
          tabAreas = self.getTabAreas(),

          tabOffsetTop = tabElement.offset().top,

          tabOffsetLeft = tabElement.offset().left,

          cursorPositionRelativeToTab =  (tabElement.outerWidth() / 2) - ((tabElement.outerWidth() / 2) - (mouseDownX - tabOffsetLeft));

          // According to the current mouse position, where should the tab go?
          var tabDestinationPos = self.getTabDestinationPos(mouseDownX, tabAreas, tabElement[0]);

          // While dragging the tab around, what was the last calculated destination position?
          var lasttabDestinationPos = tabDestinationPos,

          elementMarginLeft = parseInt(tabElement.css('margin-left')),

          offsetLeft = mouseDownX - tabOffsetLeft + elementMarginLeft;


      tabElement.after(self.createPlaceHolder());

      tabElement.remove();

      // Move the draggable Element along with the cursor x position.
      draggableElement[0].style.left = (mouseDownX - offsetLeft) + 'px';
      draggableElement[0].style.top = tabOffsetTop + 'px';

      /**
       * On Mouse Move.
       */
      var dragTab = function (eMouseMove) {

        if (!startedDragging) {
          startedDragging = true;
        }
        else {

          var mouseMoveX = eMouseMove.clientX,
              mouseMoveY = eMouseMove.clientY;

          var cursorPositionRelativeToTabContainer = mouseMoveX - cursorPositionRelativeToTab

          // Determine where the new tab position should be according to the cursor position.
          tabDestinationPos = self.getTabDestinationPos(cursorPositionRelativeToTabContainer, tabAreas, eMouseMove.target);

          // If the mouse isn't over a tab position, find out where it should go. @TODO: move to this.getTabDestinationPos func
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

            self.showDestinationHintAtPosition(tabDestinationPos, tabContainerElement);

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

        self.insertTabElementAtPosition(tabElement, tabDestinationPos, tabContainerElement);

        self.removeDestinationHint(tabContainerElement);

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
  new TabCollectionDragger('.tab', '.tabContainer');
});

