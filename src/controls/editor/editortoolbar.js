import editortemplate from './editortemplate';
import dispatcher from './editdispatcher';
import editorLayers from './editorlayers';
import { Component, Element as El } from '../../ui';
import dropDown from '../../dropdown';
import drawTools from './drawtools';

const activeClass = 'o-control-active';
const disableClass = 'o-disabled';

/**
 * Creates an EditorToolbar Component. Written as a Component, but in reality there can be only one instance as it depends
 * on hard coded element ids and DOM events.
 * @param {any} options
 * @returns Component
 */
const EditorToolbar = function EditorToolbar(options = {}) {
  let currentLayer = options.currentLayer;
  const editableLayers = options.editableLayers;
  const viewer = options.viewer;
  const modifyTools = options.modifyTools;

  let $editAttribute;
  let $editDraw;
  let $editDelete;
  let $editLayers;
  let $editSave;
  let $editSnapTools; // SKA EditorSnap: Element reference for snap/trace tools button
  let layerSelector;
  let drawToolsSelector;
  let modifyToolsBtn;
  let modifyToolsPopoverEl;

  let component;
  let selection;

  // SKA EditorSnap: Snap/Trace state machine
  const SNAP_STATES = ['none', 'snap', 'snaptrace'];
  let snapStateIndex = 0;
  // SKA EditorSnap: Update button state based on active tools
  function updateSnapToolsButtonState({ traceActive, snapActive }) {
    const active = !!traceActive || !!snapActive;
    if ($editSnapTools) {
      if (active) {
        $editSnapTools.classList.add(activeClass);
        $editSnapTools.style.opacity = '1';
      } else {
        $editSnapTools.classList.remove(activeClass);
        $editSnapTools.style.opacity = '0.7';
      }
    }
  }
  /**
   * SKA EditorSnap: Sets the visual icon and propagates state to the editor (unless emit=false)
   * state: 'none' | 'snap' | 'snaptrace'
   */
  function setSnapToolsState(state, emit = true) {
    const iconUse = document.getElementById('o-editor-snap-icon');
    const snapToolsBtn = document.getElementById('o-editor-snaptools');
    const snapToolsSpan = snapToolsBtn ? snapToolsBtn.querySelector('span') : null;
    if (!iconUse) return;
    if (state === 'none') {
      iconUse.setAttribute('xlink:href', '#fa-magnet');
      iconUse.style.opacity = '0.4';
      if (snapToolsSpan) {
        snapToolsSpan.setAttribute('data-tooltip', 'Snap/Trace - Inaktiv');
      }
      updateSnapToolsButtonState({ traceActive: false, snapActive: false });
      if (emit) {
        // SKA EditorSnap: Preserve draw state with preserveDraw flag
        document.dispatchEvent(new CustomEvent('toggleEditorTool', { detail: { tool: 'trace', active: false, preserveDraw: true } }));
        document.dispatchEvent(new CustomEvent('toggleEditorTool', { detail: { tool: 'snap', active: false, preserveDraw: true } }));
      }
    } else if (state === 'snap') {
      iconUse.setAttribute('xlink:href', '#fa-magnet');
      iconUse.style.opacity = '1';
      if (snapToolsSpan) {
        snapToolsSpan.setAttribute('data-tooltip', 'Snap - Aktivt');
      }
      updateSnapToolsButtonState({ traceActive: false, snapActive: true });
      if (emit) {
        // SKA EditorSnap: Preserve draw state with preserveDraw flag
        document.dispatchEvent(new CustomEvent('toggleEditorTool', { detail: { tool: 'trace', active: false, preserveDraw: true } }));
        document.dispatchEvent(new CustomEvent('toggleEditorTool', { detail: { tool: 'snap', active: true, preserveDraw: true } }));
      }
    } else if (state === 'snaptrace') {
      iconUse.setAttribute('xlink:href', '#fa-draw-polygon-o');
      iconUse.style.opacity = '1';
      if (snapToolsSpan) {
        snapToolsSpan.setAttribute('data-tooltip', 'Snap + Trace - Aktivt');
      }
      updateSnapToolsButtonState({ traceActive: true, snapActive: true });
      if (emit) {
        // SKA EditorSnap: Preserve draw state with preserveDraw flag
        document.dispatchEvent(new CustomEvent('toggleEditorTool', { detail: { tool: 'snap', active: true, preserveDraw: true } }));
        document.dispatchEvent(new CustomEvent('toggleEditorTool', { detail: { tool: 'trace', active: true, preserveDraw: true } }));
      }
    }
    snapStateIndex = SNAP_STATES.indexOf(state);
  }

  /**
   * Renders the toolbar. Injects itself to DOM, so no need for caller to insert it
   * @returns nothing
   */
  function render() {
    const { body: editortemplateHTML } = new DOMParser().parseFromString(editortemplate, 'text/html');
    document.getElementById('o-tools-bottom').appendChild(editortemplateHTML);
    $editAttribute = document.getElementById('o-editor-attribute');
    $editDraw = document.getElementById('o-editor-draw');
    $editDelete = document.getElementById('o-editor-delete');
    $editLayers = document.getElementById('o-editor-layers');
    // SKA EditorSnap: Get snap tools button element
    $editSnapTools = document.getElementById('o-editor-snaptools');
    if ($editSnapTools) $editSnapTools.style.cursor = 'pointer';
    $editSave = document.getElementById('o-editor-save');
    // Hide layers choice button if only 1 layer in editable
    if (editableLayers.length < 2) {
      $editLayers.parentNode.classList.add('o-hidden');
    }
    // Hide save button if configured with autoSave
    if (options.autoSave) {
      $editSave.classList.add('o-hidden');
    }
    layerSelector = editorLayers(editableLayers, viewer, {
      activeLayer: currentLayer
    });
    drawToolsSelector = drawTools(options.drawTools, currentLayer, viewer);
    modifyToolsBtn = document.getElementById('o-editor-modifytools');
    if (!modifyTools) {
      modifyToolsBtn.classList.add('o-hidden');
    }
    const pop = modifyToolsBtn.parentElement;
    const modifyToolsPopover = El({ target: pop, cls: 'o-popover' });
    modifyToolsPopoverEl = modifyToolsPopover.render();
    if ($editSnapTools && $editSnapTools.parentElement) {
      const loc = viewer.getControlByName ? viewer.getControlByName('localization') : null;
      const toolsLabel = loc ? loc.getStringByKeys({ targetParentKey: 'editor', targetKey: 'toolsLabel' }) : 'Verktyg';
      if ($editSnapTools) {
        const span = $editSnapTools.querySelector('span');
        if (span) span.setAttribute('data-tooltip', toolsLabel);
        $editSnapTools.setAttribute('aria-label', toolsLabel);
      }
      // SKA EditorSnap: Query initial snap/trace state from handler
      document.dispatchEvent(new CustomEvent('queryEditorToolState'));
    }
  }

  function toggleToolbar(state) {
    if (state) {
      const enableInteraction = new CustomEvent('enableInteraction', {
        bubbles: true,
        detail: {
          interaction: 'editor'
        }
      });
      document.querySelectorAll('.o-map')[0].dispatchEvent(enableInteraction);
    } else {
      const enableInteraction = new CustomEvent('enableInteraction', {
        bubbles: true,
        detail: {
          interaction: 'featureInfo'
        }
      });
      document.querySelectorAll('.o-map')[0].dispatchEvent(enableInteraction);
    }
  }

  function toggleModifyToolsPopover() {
    modifyToolsPopoverEl.classList.toggle('o-active');
  }

  /**
   * hides the modify tools popover. Should be called when other tool is clicked to avoid having the popover lingering
   */
  function closeModifyToolsPopover() {
    modifyToolsPopoverEl.classList.remove('o-active');
  }

  function bindUIActions() {
    $editDraw.addEventListener('click', (e) => {
      closeModifyToolsPopover();
      dispatcher.emitToggleEdit('draw');
      $editDraw.blur();
      e.preventDefault();
    });
    $editAttribute.addEventListener('click', (e) => {
      closeModifyToolsPopover();
      dispatcher.emitToggleEdit('attribute');
      $editAttribute.blur();
      e.preventDefault();
    });
    $editDelete.addEventListener('click', (e) => {
      closeModifyToolsPopover();
      dispatcher.emitToggleEdit('delete');
      $editDelete.blur();
      e.preventDefault();
    });
    $editLayers.addEventListener('click', (e) => {
      closeModifyToolsPopover();
      dispatcher.emitToggleEdit('layers');
      $editLayers.blur();
      e.preventDefault();
    });
    // SKA EditorSnap: Cycle through snap states on click
    $editSnapTools.addEventListener('click', (e) => {
      if (modifyToolsPopoverEl) modifyToolsPopoverEl.classList.remove('o-active');
      const nextIndex = (snapStateIndex + 1) % SNAP_STATES.length;
      const nextState = SNAP_STATES[nextIndex];
      setSnapToolsState(nextState, true);
      e.preventDefault();
    });

    $editSave.addEventListener('click', (e) => {
      closeModifyToolsPopover();
      dispatcher.emitToggleEdit('save');
      $editSave.blur();
      e.preventDefault();
    });
    modifyToolsBtn.addEventListener('click', (e) => {
      if (!modifyToolsBtn.classList.contains(disableClass)) {
        toggleModifyToolsPopover();
        modifyToolsBtn.blur();
      }
      e.preventDefault();
    });
    // Event listener for when modify tool dropdown selects a tool
    modifyToolsPopoverEl.addEventListener('changeDropdown', (e) => {
      e.stopImmediatePropagation(e);
      closeModifyToolsPopover();
      // Dispatch the selected tool as a Component event to our listeners (edit component)
      component.dispatch('modifytoolchanged', e.detail.dataAttribute);
    });
  }

  /**
 * Sets visibility of the tools in the toolbar according to the current layer's configuration.
 * Note that it only sets the visibility of the the tools in the toolbar, it does not enforce anything.
 * */
  function setAllowedTools() {
    const layer = viewer.getLayer(currentLayer);
    const allowedOperations = layer.get('allowedEditOperations');
    if (allowedOperations && !allowedOperations.includes('updateAttributes')) {
      $editAttribute.classList.add('o-hidden');
    } else {
      $editAttribute.classList.remove('o-hidden');
    }
    if (allowedOperations && !allowedOperations.includes('create')) {
      $editDraw.classList.add('o-hidden');
    } else {
      $editDraw.classList.remove('o-hidden');
    }
    if (allowedOperations && !allowedOperations.includes('delete')) {
      $editDelete.classList.add('o-hidden');
    } else {
      $editDelete.classList.remove('o-hidden');
    }
    // SKA EditorSnap: Sync simple tools state (snap) and ask handler for trace state
    const snapEl = document.getElementById('o-editor-tools-snap');
    if (snapEl) {
      snapEl.checked = !!layer.get('snap');
    }
    // SKA EditorSnap: Ask editor handler what the current trace state is
    document.dispatchEvent(new CustomEvent('queryEditorToolState'));

    // Set allowed modifyTools depending on selection and layer type
    const availableTools = [];
    if (selection && selection.length === 1 && selection[0].getGeometry().getType() === 'LineString') {
      // Split line is only available when exactly one LineString is selected
      availableTools.push({
        name: 'Dela linje',
        value: 'split-line-by-point'
      });
    }
    // Rebuild content of popover and grey out button if no valid tools.
    modifyToolsBtn.classList.add(disableClass);
    modifyToolsPopoverEl.innerHTML = '';
    if (availableTools.length > 0) {
      modifyToolsBtn.classList.remove(disableClass);
      dropDown(modifyToolsPopoverEl.id, availableTools, {});
    } else {
      closeModifyToolsPopover();
    }
  }

  function setActive(state) {
    if (state === true) {
      setAllowedTools();
      document.getElementById('o-editor-toolbar').classList.remove('o-hidden');
    } else {
      closeModifyToolsPopover();
      document.getElementById('o-editor-toolbar').classList.add('o-hidden');
    }
  }

  function onEnableInteraction(e) {
    const { detail: { interaction } } = e;
    e.stopPropagation();
    if (interaction === 'editor') {
      setActive(true);
      dispatcher.emitToggleEdit('edit', {
        currentLayer
      });
    } else {
      setActive(false);
      dispatcher.emitToggleEdit('cancel');
    }
  }

  function onChangeEdit(e) {
    const { detail: { tool, active } } = e;
    if (tool === 'draw') {
      if (active === false) {
        $editDraw.classList.remove(activeClass);
      } else {
        $editDraw.classList.add(activeClass);
      }
    }
    if (tool === 'layers') {
      if (active === false) {
        $editLayers.classList.remove(activeClass);
      } else {
        $editLayers.classList.add(activeClass);
      }
    } else if (active) {
      $editLayers.classList.remove(activeClass);
    }
  }

  function toggleSave(e) {
    const { detail: { edits } } = e;
    if (edits) {
      if ($editSave.classList.contains(disableClass)) {
        $editSave.classList.remove(disableClass);
      }
    } else {
      $editSave.classList.add(disableClass);
    }
  }

  function changeLayerInternal(layer) {
    currentLayer = layer;
    setAllowedTools();
  }

  /**
   * Called when toggleEdit event is raised
   * @param {any} e Custom event
   */
  function onToggleEdit(e) {
    const { detail: { tool } } = e;
    // If the event contains a currentLayer, the currentLayer has either changed
    // or the editor toolbar is activated and should display the last edited layer or default if first time
    if (tool === 'edit' && e.detail.currentLayer) {
      changeLayerInternal(e.detail.currentLayer);
    }
    e.stopPropagation();
  }

  // Here be the return statement that returns the Component created
  return Component({
    onInit() {
      document.addEventListener('enableInteraction', onEnableInteraction);
      document.addEventListener('changeEdit', onChangeEdit);
      document.addEventListener('editsChange', toggleSave);
      document.addEventListener('toggleEdit', onToggleEdit);
      // SKA EditorSnap: Listen for editor tool state changes and update UI
      document.addEventListener('editorToolState', (e) => {
        // SKA EditorSnap: Extract trace and snap state from event
        const { trace, snap } = e.detail || {};
        // SKA EditorSnap: Sync icon to match current snap/trace state
        let state = 'none';
        if (snap && trace) state = 'snaptrace';
        else if (snap) state = 'snap';
        else state = 'none';
        setSnapToolsState(state, false);
      });
      component = this;
    },
    onRender() {
      bindUIActions();
      if (options.isActive) {
        setActive(true);
      }
      this.dispatch('render');
    },
    render,
    /**
     * Notifies the toolbar of the current selection and updates available tools for the current selection/layer combination
     * @param {Any[]} features The currently selected features as an array of features
     */
    setSelection(features) {
      selection = features;
      setAllowedTools();
    },
    toggleToolbar,
    /**
   * Updates layer selection list to reflect the current setting
   * @param {any} layerName
   */
    changeActiveLayer: (layerName) => {
      changeLayerInternal(layerName);
      layerSelector.changeLayer(layerName);
      drawToolsSelector.updateTools(layerName);
    }
  });
};

export default EditorToolbar;
