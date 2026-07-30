import{s as n,d,a as l,a5 as i,h as c,e as r,i as u,at as b,k as m,o as t,_ as p}from"./index-49TE631d.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],f=n("loader-circle",y),B=["type","disabled","aria-busy"],k=d({__name:"LsButton",props:{variant:{default:"primary"},size:{default:"md"},loading:{type:Boolean},disabled:{type:Boolean},type:{default:"button"}},setup(e){const a=e,s=m(()=>["ls-button",`ls-button--${a.variant}`,`ls-button--${a.size}`]);return(o,v)=>(t(),l("button",{type:e.type,class:i(s.value),disabled:e.disabled||e.loading,"aria-busy":e.loading||void 0},[e.loading?(t(),c(r(f),{key:0,size:18,class:"ls-button__spinner","aria-hidden":"true"})):u("",!0),b(o.$slots,"default",{},void 0,!0)],10,B))}}),h=p(k,[["__scopeId","data-v-b6de9c5b"]]);export{h as L};
