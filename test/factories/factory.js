const assignDefaults = Symbol("assignDefaults");

class Factory {
  constructor() {
    this.attrs = {};
  }

  setScalar(attrName, value) {
    this.attrs[attrName] = value;
    return this;
  }

  setFactory(attrName, Factory, block) {
    const factory = new Factory();
    block(factory);
    this.attrs[attrName] = factory.build();
    return this;
  }

  addScalar(attrName, value) {
    if (!(attrName in this.attrs)) {
      this.attrs[attrName] = [];
    }
    this.attrs[attrName].push(value);
    return this;
  }

  addFactory(attrName, Factory, block) {
    if (!(attrName in this.attrs)) {
      this.attrs[attrName] = [];
    }
    const factory = new Factory();
    block(factory);
    this.attrs[attrName].push(factory.build());
    return this;
  }

  [assignDefaults]() {}

  build() {
    this[assignDefaults]();
    return this.attrs;
  }
}

export function createFactory(klassName, specs) {
  const Klass = class extends Factory {};
  Klass.displayName = klassName;

  function makeScalarSetter(attrName) {
    return function(value) {
      return this.setScalar(attrName, value);
    };
  }

  function makeScalarAdder(attrName) {
    return function(value) {
      return this.addScalar(attrName, value);
    };
  }

  function makeFactorySetter(attrName, Factory) {
    return function(block) {
      return this.setFactory(attrName, Factory, block);
    };
  }

  function makeFactoryAdder(attrName, Factory) {
    return function(block) {
      return this.addFactory(attrName, Factory, block);
    };
  }

  for (const attrName of attrNames) {
    const spec = {
      factory: null,
      plural: false,
      ...specs[attrName],
    };

    const adderName = "add" + attrName[0].toUpperCase() + attrName.slice(1);

    if (spec.factory === null && !spec.plural) {
      Klass.prototype[attrName] = makeScalarSetter(attrName);
    } else if (spec.factory === null && spec.plural) {
      Klass.prototype[adderName] = makeScalarAdder(attrName);
    } else if (spec.factory !== null && !spec.plural) {
      Klass.prototype[attrName] = makeFactorySetter(attrName, spec.factory);
    } else if (spec.factory !== null && spec.plural) {
      Klass.prototype[adderName] = makeFactoryAdder(attrName, spec.factory);
    }
  }

  Klass.prototype[assignDefaults] = function() {
    for (const attrName of attrNames) {
      const spec = specs[attrName];
      if (!(attrName in this.attrs)) {
        if ("default" in spec) {
          this.attrs[attrName] = spec.default;
        } else if (spec.plural) {
          this.attrs[attrName] = [];
        } else if (spec.factory) {
          const f = new spec.factory();
          this.attrs[attrName] = f.build();
        }
      }
    }
  };

  return Klass;
}
