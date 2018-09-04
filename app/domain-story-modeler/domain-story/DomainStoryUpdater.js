import inherits from 'inherits';

import {
  pick,
  assign
} from 'min-dash';

import CommandInterceptor from 'diagram-js/lib/command/CommandInterceptor';

import {
  add as collectionAdd,
  remove as collectionRemove
} from 'diagram-js/lib/util/Collections';


/**
 * a handler responsible for updating the custom element's businessObject
 * once changes on the diagram happen.
 */
export default function DomainStoryUpdater(eventBus, bpmnjs) {

  CommandInterceptor.call(this, eventBus);

  function updateCustomElement(e) {
    var context = e.context,
        shape = context.shape,
        businessObject = shape.businessObject;

    if (!isDomainStory(shape)) {
      return;
    }

    var parent = shape.parent;
    var customElements = bpmnjs._customElements;

    // make sure element is added / removed from bpmnjs.customElements
    if (!parent) {
      collectionRemove(customElements, businessObject);
    } else {
      collectionAdd(customElements, businessObject);
    }

    // save custom element position
    assign(businessObject, pick(shape, ['x', 'y']));
    // save custom element size if resizable
    if (isDomainStoryGroup(shape)) {

      // TODO
      // when we go through the children of the canvas, for some reason we only get half of the array
      // going through it 8 times equals 256 elements, which should be enough

      for (var i = 9; i > 0; i--) {
        assign(businessObject, pick(shape, ['height', 'width']));
        if (parent != null) {
          parent.children.forEach(innerShape => {
            if ((innerShape.id) != shape.id) {
              if (innerShape.x >= shape.x && innerShape.x <= shape.x + shape.width) {
                if (innerShape.y >= shape.y && innerShape.y <= shape.y + shape.height) {
                  innerShape.parent = shape;
                  shape.children.push(innerShape);
                }
              }
            }
          });
        }
      }
    }
    if (isInDomainStoryGroup(shape)) {
      assign(businessObject, {
        parent: shape.parent.id
      });
    }
  }

  function updateCustomConnection(e) {

    var context = e.context,
        connection = context.connection,
        source = connection.source,
        target = connection.target,
        businessObject = connection.businessObject;

    var parent = connection.parent;

    var customElements = bpmnjs._customElements;

    // make sure element is added / removed from bpmnjs.customElements
    if (!parent) {
      collectionRemove(customElements, businessObject);
    } else {
      collectionAdd(customElements, businessObject);
    }

    // update waypoints
    assign(businessObject, {
      waypoints: copyWaypoints(connection)
    });

    if ((!businessObject.source && !businessObject.target) && (source && target)) {
      assign(businessObject, {
        source: source.id,
        target: target.id
      });
    }

  }

  this.executed([
    'shape.create',
    'shape.move',
    'shape.delete',
    'shape.resize'
  ], ifDomainStoryElement(updateCustomElement));

  this.reverted([
    'shape.create',
    'shape.move',
    'shape.delete',
    'shape.resize'
  ], ifDomainStoryElement(updateCustomElement));

  this.executed([
    'connection.create',
    'connection.reconnectStart',
    'connection.reconnectEnd',
    'connection.updateWaypoints',
    'connection.delete',
    'connection.layout',
    'connection.move'
  ], ifDomainStoryElement(updateCustomConnection));

  this.reverted([
    'connection.create',
    'connection.reconnectStart',
    'connection.reconnectEnd',
    'connection.updateWaypoints',
    'connection.delete',
    'connection.layout',
    'connection.move'
  ], ifDomainStoryElement(updateCustomConnection));

}

inherits(DomainStoryUpdater, CommandInterceptor);

DomainStoryUpdater.$inject = ['eventBus', 'bpmnjs'];


// -- helpers --//

function copyWaypoints(connection) {
  return connection.waypoints.map(function(p) {
    if (p.original) {
      return {
        original: {
          x: p.original.x,
          y: p.original.y
        },
        x: p.x,
        y: p.y
      };
    } else {
      return {
        x: p.x,
        y: p.y
      };
    }


  });
}

function isDomainStory(element) {
  return element && /domainStory:/.test(element.type);
}

function isDomainStoryGroup(element) {
  return element && /domainStory:group/.test(element.type);
}

function isInDomainStoryGroup(element) {
  return isDomainStoryGroup(element.parent);
}

function ifDomainStoryElement(fn) {
  return function(event) {
    var context = event.context,
        element = context.shape || context.connection;

    if (isDomainStory(element)) {
      fn(event);
    }
  };
}