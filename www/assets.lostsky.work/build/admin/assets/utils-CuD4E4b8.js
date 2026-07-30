function e(i){const t=Number(i??0);return t?new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(t*1e3):"—"}export{e as f};
