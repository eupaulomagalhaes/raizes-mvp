export const UI = {
  Button: ({label, variant='primary', type='button', attrs=''}) => `
    <button class="btn" data-variant="${variant}" type="${type}" ${attrs}>${label}</button>
  `,
  Input: ({id, label, type='text', placeholder='', required=false, value=''}) => `
    <label class="block space-y-1">
      <span class="label">${label}${required?' *':''}</span>
      <input id="${id}" class="input" type="${type}" placeholder="${placeholder}" ${required?'required':''} value="${value}" />
    </label>
  `,
  Select: ({id, label, options=[], required=false}) => `
    <label class="block space-y-1">
      <span class="label">${label}${required?' *':''}</span>
      <select id="${id}" class="select" ${required?'required':''}>
        ${options.map(o=>`<option value="${o.value}">${o.label}</option>`).join('')}
      </select>
    </label>
  `,
  Card: (content) => `<div class="card card-border p-6">${content}</div>`,
  ProgressBar: (percent=0, attrs='') => `
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" ${attrs}>
      <div class="bar" style="width:${percent}%"></div>
    </div>
  `,
};
