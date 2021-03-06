/* eslint-env browser */
/* eslint-disable no-restricted-syntax, no-prototype-builtins, no-continue, no-alert */
const m = require('mithril');
const util = require('../util');

function moduleSelector(ctrl) {
  const options = [m('option', {value: ''}, '<< Add module... >>')];
  const modules = ctrl.engine.state.modules;
  for (const key in modules) {
    if (!modules.hasOwnProperty(key)) continue;
    const module = modules[key];
    options.push(m('option', {value: key}, `${module.friendlyName || key}`));
  }
  return m('div.module-selector', {key: 'module-sel'}, m('select', {
    onchange(event) {
      ctrl.engine.state.addModule(event.target.value);
      event.target.value = '';
    },
  }, options));
}

function rotateChoiceParam({choices}, value, direction) {
  const currentValueIndex = choices.indexOf(value);
  if (currentValueIndex === -1) return value;
  const newValueIndex = (currentValueIndex + direction + choices.length) % choices.length;
  return choices[newValueIndex];
}

function getParamEditor(def, paramDef) {
  const paramName = paramDef.name;
  const paramNode = m(`div.param.param-${paramDef.type}`, {key: `${def.id}-${paramName}`}, []);
  const value = def.options[paramName];

  if (paramDef.type === 'bool') {
    paramNode.children.push(m('label',
      m('input', {
        onclick() {
          def.options[paramName] = !def.options[paramName];
        },
        checked: !!value,
        type: 'checkbox',
      }),
      paramName,
    ));
  }

  if (paramDef.type === 'int' || paramDef.type === 'num') {
    paramNode.children.push(m('div.param-name', paramName));

    paramNode.children.push(
      m('div.slider-and-input',
        m('input.slider', {
          oninput(event) {
            def.options[paramName] = event.target.valueAsNumber;
          },
          value,
          min: paramDef.min,
          max: paramDef.max,
          step: (paramDef.step !== null ? paramDef.step : 0.0001),
          type: 'range',
        }),
        m('input.num', {
          oninput(event) {
            def.options[paramName] = event.target.valueAsNumber;
          },
          value,
          step: (paramDef.step !== null ? paramDef.step : 0.0001),
          type: 'number',
        }),
      ),
    );
  }

  if (paramDef.type === 'choice') {
    paramNode.children.push(m('div.param-name', paramName));
    paramNode.children.push(
      m('div', [
        m(
          'select',
          {
            value,
            oninput(event) {
              def.options[paramName] = event.target.value;
            },
          },
          paramDef.choices.map((choice) => m('option', {value: choice}, choice))
        ),
        m('a', {
          href: '#',
          onclick() {
            def.options[paramName] = rotateChoiceParam(paramDef, value, -1);
          },
        }, m('i.fa.fa-arrow-left')),
        '\u2022',
        m('a', {
          href: '#',
          onclick() {
            def.options[paramName] = rotateChoiceParam(paramDef, value, +1);
          },
        }, m('i.fa.fa-arrow-right')),
      ])
    );
  }
  return paramNode;
}

const defEditor = (ctrl, state, def) => {
  const enabled = (def.enabled && def.probability > 0);
  const params = (def.module.params || []);
  const collapseBtn = (
    params.length ?
      m('button',
        {
          onclick() {
            def.uiVisible = !def.uiVisible;
          },
          title: (def.uiVisible ? 'Collapse' : 'Expand'),
        },
        m((def.uiVisible ? 'i.fa.fa-chevron-up' : 'i.fa.fa-chevron-down')),
      ) : null
  );
  return m(`div.def-edit${!enabled ? '.disabled' : ''}`,
    {key: def.id},
    [
      m('div.def-kit.button-row',
        [
          m('div.module-name', [def.moduleName]),
          m('input.prob-slider',
            {
              oninput(event) {
                def.probability = event.target.valueAsNumber;
              },
              value: def.probability,
              min: 0,
              max: 1,
              step: 0.01,
              type: 'range',
              title: `probability: ${def.probability.toFixed(2)}`,
            }),
          collapseBtn,
          m('button', {
            onclick() {
              def.enabled = !def.enabled;
            },
            title: (def.enabled ? 'Disable' : 'Enable'),
          }, m('i.fa.fa-power-off')),
          m('button', {
            onclick() {
              state.deleteDef(def);
            },
            title: 'Delete',
          }, m('i.fa.fa-times')),
          m('button', {
            onclick() {
              state.moveDef(def, -1);
            },
            title: 'Move Up',
          }, m('i.fa.fa-arrow-up')),
          m('button', {
            onclick() {
              state.moveDef(def, +1);
            },
            title: 'Move down',
          }, m('i.fa.fa-arrow-down')),
          m('button', {
            onclick() {
              util.randomizeDef(def);
            },
            title: 'Randomize',
          }, m('i.fa.fa-random')),
          m('button', {
            onclick() {
              state.duplicateDef(def);
            },
            title: 'Duplicate',
          }, m('i.fa.fa-plus')),
        ]),
      (def.uiVisible ?
          m(
            'div.params',
            params.map((pDef) => getParamEditor(def, pDef))
          ) : null
      ),
    ],
  );
};


function moduleList(ctrl) {
  const state = ctrl.engine.state;
  return m(
    'div.module-list',
    {key: 'module-list'},
    state.defs.map((def) => defEditor(ctrl, state, def))
  );
}

module.exports = function fxUI(ctrl) {
  return m(
    'div.fx-ui',
    {key: 'fx-ui'},
    [
      moduleSelector(ctrl),
      moduleList(ctrl),
    ]);
};
