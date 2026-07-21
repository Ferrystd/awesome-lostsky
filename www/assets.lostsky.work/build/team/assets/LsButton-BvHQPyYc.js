import{f as n,g as d,j as l,a5 as i,y as c,u as r,v as u,al as b,d as m,i as t,_ as y}from"./index-BvpFVGT5.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],p=n("loader-circle",f),v=["type","disabled","aria-busy"],B=d({__name:"LsButton",props:{variant:{default:"primary"},size:{default:"md"},loading:{type:Boolean},disabled:{type:Boolean},type:{default:"button"}},setup(e){const a=e,s=m(()=>["ls-button",`ls-button--${a.variant}`,`ls-button--${a.size}`]);return(o,_)=>(t(),l("button",{type:e.type,class:i(s.value),disabled:e.disabled||e.loading,"aria-busy":e.loading||void 0},[e.loading?(t(),c(r(p),{key:0,size:18,class:"ls-button__spinner","aria-hidden":"true"})):u("",!0),b(o.$slots,"default",{},void 0,!0)],10,v))}}),k=y(B,[["__scopeId","data-v-bf286786"]]);export{k as L};
