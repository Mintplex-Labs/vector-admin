function flattenObj(ob: object = {}) {
  let result = {};
  for (const i in ob) {
    if (typeof ob[i] === 'object' && !Array.isArray(ob[i])) {
      const temp = flattenObj(ob[i]);
      for (const j in temp) {
        result[i + '.' + j] = temp[j];
      }
    } else {
      result[i] = ob[i];
    }
  }
  return result;
}

export function castToType(preferredType = 'string', value: any) {
  switch (preferredType) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
  }
}

export function constructModifiedMetadata(formEl: HTMLFormElement) {
  var data = {};
  const form = new FormData(formEl);

  function setNestedKeyValue(key: string, value: any) {
    var keys = key.split('.');
    var pos = keys.shift();
    if (!data.hasOwnProperty(pos)) data[pos] = {};

    keys.forEach((key, i) => {
      const currentData = eval(`data.${pos}`);
      if (!currentData.hasOwnProperty(key)) currentData[key] = {};
      if (i === keys.length - 1) currentData[key] = value;
      pos += `.${key}`;
    });

    return data;
  }

  for (var [_k, value] of form.entries()) {
    if (/\s/.test(_k)) continue; // No whitespace in keys
    const outputType =
      formEl.querySelector(`[name="${_k}"]`)?.dataset?.outputType || 'string';

    if (_k.includes('.')) {
      data = setNestedKeyValue(_k, castToType(outputType, value));
    } else {
      data[_k] = castToType(outputType, value);
    }
  }

  return flattenObj(data);
}
