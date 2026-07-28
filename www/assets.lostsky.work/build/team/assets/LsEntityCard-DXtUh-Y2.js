import{aa as l,f as C,i as n,j as s,x as g,y as B,t as c,k as d,u as r,m,q as o,d as k,h as a,a8 as E,U as L,al as h,ab as p,_ as N}from"./index--6Kpy4Zw.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=[["path",{d:"M10 12h4",key:"a56b0p"}],["path",{d:"M10 8h4",key:"1sr2af"}],["path",{d:"M14 21v-3a2 2 0 0 0-4 0v3",key:"1rgiei"}],["path",{d:"M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",key:"secmi2"}],["path",{d:"M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",key:"16ra0t"}]],x=l("building-2",V);/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=[["path",{d:"m11 17 2 2a1 1 0 1 0 3-3",key:"efffak"}],["path",{d:"m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4",key:"9pr0kb"}],["path",{d:"m21 3 1 11h-2",key:"1tisrp"}],["path",{d:"M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3",key:"1uvwmv"}],["path",{d:"M3 4h8",key:"1ep09j"}]],b=l("handshake",$);/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],I=l("info",z);/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",key:"1sd12s"}],["path",{d:"M8 12h.01",key:"czm47f"}],["path",{d:"M12 12h.01",key:"1mp3jc"}],["path",{d:"M16 12h.01",key:"1l6xoz"}]],w=l("message-circle-more",j),U=e=>({entity:"成员",teamMember:"成员",customer:"客户",teamCustomer:"客户",team:"团队",virtual:"虚拟实体",teamVirtual:"虚拟实体",unknown:"实体"})[e],_={class:"entity-card"},D={class:"entity-card__icon","aria-hidden":"true"},H={class:"entity-card__identity"},T={key:0,class:"entity-card__actions"},q=["aria-label"],R=C({__name:"LsEntityCard",props:{entity:{},clearable:{type:Boolean,default:!1},clearLabel:{default:""},chatEnabled:{type:Boolean,default:!0},profileEnabled:{type:Boolean,default:!0}},emits:["chat","profile","clear"],setup(e,{emit:f}){const y=e,i=f,v=k(()=>U(y.entity.type)),M=k(()=>({team:x,entity:p,teamMember:p,customer:b,teamCustomer:b,virtual:h,teamVirtual:h,unknown:L})[y.entity.type]);return(S,t)=>(a(),n("article",_,[s("span",D,[(a(),g(B(M.value),{size:19}))]),s("div",H,[s("small",null,c(v.value),1),s("strong",null,c(e.entity.name),1),s("span",null,"@"+c(e.entity.slug),1)]),e.chatEnabled||e.profileEnabled?(a(),n("div",T,[e.chatEnabled?(a(),n("button",{key:0,type:"button",onClick:t[0]||(t[0]=u=>i("chat",e.entity))},[d(r(w),{size:16}),t[3]||(t[3]=m("聊天",-1))])):o("",!0),e.profileEnabled?(a(),n("button",{key:1,type:"button",onClick:t[1]||(t[1]=u=>i("profile",e.entity))},[d(r(I),{size:16}),t[4]||(t[4]=m("简介",-1))])):o("",!0)])):o("",!0),e.clearable?(a(),n("button",{key:1,class:"entity-card__clear",type:"button","aria-label":e.clearLabel||`清除 ${e.entity.name}`,onClick:t[2]||(t[2]=u=>i("clear",e.entity))},[d(r(E),{size:18})],8,q)):o("",!0)]))}}),A=N(R,[["__scopeId","data-v-c8520dcf"]]);export{A as L,U as e};
