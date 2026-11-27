import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../../src/app/App';
import { ThrlenderEngine } from '../../src/ThrlenderEngine';
import '../../src/index.css';

const engines = [];
const init = ThrlenderEngine.prototype.init;
ThrlenderEngine.prototype.init = function (host) {
  init.call(this, host);
  const record = { engine: this, frames: 0, geometryDisposals: 0 };
  const render = this.render.bind(this);
  this.render = () => {
    record.frames++;
    render();
  };
  this.gridHelper.geometry.addEventListener('dispose', () => record.geometryDisposals++);
  engines.push(record);
};

let root;
Object.assign(window, {
  engines,
  current: () => engines.at(-1).engine,
  mountEditor() {
    root = createRoot(document.querySelector('#root'));
    root.render(<StrictMode><App /></StrictMode>);
  },
  unmountEditor() {
    root.unmount();
  },
});
