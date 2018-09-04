import inherits from 'inherits';

import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

import {
  assign,
  bind
} from 'min-dash';


export default function DomainStoryContextPadProvider(injector, connect, translate, elementFactory, create, canvas, contextPad, popupMenu, replaceMenuProvider) {

  injector.invoke(ContextPadProvider, this);
  var autoPlace = injector.get('autoPlace', false);

  var cached = bind(this.getContextPadEntries, this);

  popupMenu.registerProvider('ds-replace', replaceMenuProvider);
  popupMenu.registerProvider('bpmn-replace', replaceMenuProvider);

  this.getContextPadEntries = function(element) {
    var actions = cached(element);

    function startConnect(event, element, autoActivate) {
      connect.start(event, element, autoActivate);
    }

    // entries only for specific types of elements:
    switch (element.type) {
    // Google Material Icon Font does not seem to allow to put the icon name inline
    // since diagram-js's ContextPad does assume the icon is provided inline,
    // we could either write our own ContextPad or fix the html manually. Here, we do the latter:
    case 'domainStory:workObject':
    case 'domainStory:workObjectFolder':
    case 'domainStory:workObjectCall':
    case 'domainStory:workObjectEmail':
    case 'domainStory:workObjectBubble':
    case 'domainStory:workObjectInfo':

      assign(actions, {
        'append.actorPerson': appendAction('domainStory:actorPerson', 'icon-domain-story-actor-person', 'person'),
        'append.actorGroup': appendAction('domainStory:actorGroup', 'icon-domain-story-actor-group', 'people'),
        'append.actorSystem': appendAction('domainStory:actorSystem', 'icon-domain-story-actor-system', 'system')
      });

    case 'domainStory:actorPerson':
    case 'domainStory:actorGroup':
    case 'domainStory:actorSystem':

      assign(actions, {
        'append.workObject': appendAction('domainStory:workObject', 'icon-domain-story-workObject', 'workobject'),
        'append.workObjectFolder': appendAction('domainStory:workObjectFolder', 'icon-domain-story-workObject-folder', 'folder'),
        'append.workObjectCall': appendAction('domainStory:workObjectCall', 'icon-domain-story-workObject-call', 'call'),
        'append.workObjectEmail': appendAction('domainStory:workObjectEmail', 'icon-domain-story-workObject-email', 'email'),
        'append.workObjectBubble': appendAction('domainStory:workObjectBubble', 'icon-domain-story-workObject-bubble', 'conversation'),
        'append.workObjectInfo': appendAction('domainStory:workObjectInfo', 'icon-domain-story-workObject-info', 'information')
      });

      // replace menu entry
      assign(actions, {
        'replace': {
          group: 'edit',
          className: 'bpmn-icon-screw-wrench',
          title: translate('Change type'),
          action: {
            click: function(event, element) {

              var position = assign(getReplaceMenuPosition(element), {
                cursor: { x: event.x, y: event.y }
              });
              popupMenu.open(element, 'ds-replace', position);
            }
          }
        }
      });

      assign(actions, {
        'connect': {
          group: 'connect',
          className: 'bpmn-icon-connection',
          title: translate('Connect using custom connection'),
          action: {
            click: startConnect,
            dragstart: startConnect
          }
        }
      });

    case 'domainStory:group':

      assign(actions, {
        'append.text-annotation': appendAction('domainStory:textAnnotation', 'bpmn-icon-text-annotation')
      });

    }
    return actions;
  };


  function getReplaceMenuPosition(element) {

    var Y_OFFSET = 5;

    var diagramContainer = canvas.getContainer(),
        pad = contextPad.getPad(element).html;

    var diagramRect = diagramContainer.getBoundingClientRect(),
        padRect = pad.getBoundingClientRect();

    var top = padRect.top - diagramRect.top;
    var left = padRect.left - diagramRect.left;

    var pos = {
      x: left,
      y: top + padRect.height + Y_OFFSET
    };

    return pos;
  }


  /**
  * create an append action
  *
  * @param {String} type
  * @param {String} className
  * @param {String} [title]
  * @param {Object} [options]
  *
  * @return {Object} descriptor
  */
  function appendAction(type, className, title, options) {

    if (typeof title !== 'string') {
      options = title;
      title = translate('{type}', { type: type.replace(/^domainStory:/, '') });
    }

    function appendStart(event, element) {

      var shape = elementFactory.createShape(assign({ type: type }, options));
      create.start(event, shape, element);
    }

    autoPlace ? function(element) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      autoPlace.append(element, shape);
    } : appendStart;

    return {
      group: 'model',
      className: className,
      title: 'Append ' + title,
      action: {
        dragstart: appendStart,
        click: appendStart
      }
    };
  }
}

inherits(DomainStoryContextPadProvider, ContextPadProvider);

DomainStoryContextPadProvider.$inject = [
  'injector',
  'connect',
  'translate',
  'elementFactory',
  'create',
  'canvas',
  'contextPad',
  'popupMenu',
  'replaceMenuProvider'
];