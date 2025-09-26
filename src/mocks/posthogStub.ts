const noop = () => {};

const posthogStub = {
  init: noop,
  capture: noop,
  identify: noop,
  reset: noop,
  opt_out_capturing: noop,
  opt_in_capturing: noop,
  isFeatureEnabled: () => false,
  register: noop,
  unregister: noop,
  onFeatureFlags: noop,
  reloadFeatureFlags: noop,
  get_property: () => undefined,
  people: {
    set: noop,
    set_once: noop,
    increment: noop,
  },
};

export default posthogStub;
