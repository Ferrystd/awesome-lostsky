import{bh as ye,k as A,G as M,aP as it,d as he,ai as dt,O as u,bN as bt,bz as cn,bO as Ot,bP as zt,a2 as Le,bQ as fn,bR as hn,bS as rt,bT as vn,bU as qe,aL as ee,br as Ae,P as ut,a9 as gn,bV as et,K as Ce,a3 as Mt,ac as ct,ae as bn,af as ft,bW as ze,bX as ht,aD as pn,E as Pt,ay as _,aB as j,az as ae,ax as fe,aC as at,aA as It,al as pt,bo as mn,ak as wn,av as xn,aF as vt,bc as kt,aH as Me,aJ as gt,aO as Ee,bY as yn,aS as xe,bw as Ne,bZ as Cn,b_ as Sn,ag as Oe,b$ as Rn,F as Fn,c0 as Tn,aQ as On,ap as zn,aq as Mn,ar as Pn,aE as st,as as In,b8 as kn,at as mt,aI as wt,aG as Bn,aK as $n,au as _n,aN as An,bp as En,aM as ce,c1 as Nn}from"./index-BOyCvV1c.js";import{a as Ln,u as Wn}from"./Input-BcupUcG3.js";import{N as tt}from"./Tag-DQJZj--J.js";import{e as Dn,N as Hn}from"./Empty-BeWDTjTz.js";function xt(e){return e&-e}class Bt{constructor(n,o){this.l=n,this.min=o;const l=new Array(n+1);for(let i=0;i<n+1;++i)l[i]=0;this.ft=l}add(n,o){if(o===0)return;const{l,ft:i}=this;for(n+=1;n<=l;)i[n]+=o,n+=xt(n)}get(n){return this.sum(n+1)-this.sum(n)}sum(n){if(n===void 0&&(n=this.l),n<=0)return 0;const{ft:o,min:l,l:i}=this;if(n>i)throw new Error("[FinweckTree.sum]: `i` is larger than length.");let f=n*l;for(;n>0;)f+=o[n],n-=xt(n);return f}getBound(n){let o=0,l=this.l;for(;l>o;){const i=Math.floor((o+l)/2),f=this.sum(i);if(f>n){l=i;continue}else if(f<n){if(o===i)return this.sum(o+1)<=n?o+1:i;o=i}else return i}return o}}let Ue;function Vn(){return typeof document>"u"?!1:(Ue===void 0&&("matchMedia"in window?Ue=window.matchMedia("(pointer:coarse)").matches:Ue=!1),Ue)}let nt;function yt(){return typeof document>"u"?1:(nt===void 0&&(nt="chrome"in window?window.devicePixelRatio:1),nt)}const $t="VVirtualListXScroll";function jn({columnsRef:e,renderColRef:n,renderItemWithColsRef:o}){const l=M(0),i=M(0),f=A(()=>{const m=e.value;if(m.length===0)return null;const w=new Bt(m.length,0);return m.forEach((C,I)=>{w.add(I,C.width)}),w}),h=ye(()=>{const m=f.value;return m!==null?Math.max(m.getBound(i.value)-1,0):0}),r=m=>{const w=f.value;return w!==null?w.sum(m):0},p=ye(()=>{const m=f.value;return m!==null?Math.min(m.getBound(i.value+l.value)+1,e.value.length-1):0});return it($t,{startIndexRef:h,endIndexRef:p,columnsRef:e,renderColRef:n,renderItemWithColsRef:o,getLeft:r}),{listWidthRef:l,scrollLeftRef:i}}const Ct=he({name:"VirtualListRow",props:{index:{type:Number,required:!0},item:{type:Object,required:!0}},setup(){const{startIndexRef:e,endIndexRef:n,columnsRef:o,getLeft:l,renderColRef:i,renderItemWithColsRef:f}=dt($t);return{startIndex:e,endIndex:n,columns:o,renderCol:i,renderItemWithCols:f,getLeft:l}},render(){const{startIndex:e,endIndex:n,columns:o,renderCol:l,renderItemWithCols:i,getLeft:f,item:h}=this;if(i!=null)return i({itemIndex:this.index,startColIndex:e,endColIndex:n,allColumns:o,item:h,getLeft:f});if(l!=null){const r=[];for(let p=e;p<=n;++p){const m=o[p];r.push(l({column:m,left:f(p),item:h}))}return r}return null}}),Kn=qe(".v-vl",{maxHeight:"inherit",height:"100%",overflow:"auto",minWidth:"1px"},[qe("&:not(.v-vl--show-scrollbar)",{scrollbarWidth:"none"},[qe("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb",{width:0,height:0,display:"none"})])]),Un=he({name:"VirtualList",inheritAttrs:!1,props:{showScrollbar:{type:Boolean,default:!0},columns:{type:Array,default:()=>[]},renderCol:Function,renderItemWithCols:Function,items:{type:Array,default:()=>[]},itemSize:{type:Number,required:!0},itemResizable:Boolean,itemsStyle:[String,Object],visibleItemsTag:{type:[String,Object],default:"div"},visibleItemsProps:Object,ignoreItemResize:Boolean,onScroll:Function,onWheel:Function,onResize:Function,defaultScrollKey:[Number,String],defaultScrollIndex:Number,keyField:{type:String,default:"key"},paddingTop:{type:[Number,String],default:0},paddingBottom:{type:[Number,String],default:0}},setup(e){const n=Ot();Kn.mount({id:"vueuc/virtual-list",head:!0,anchorMetaName:zt,ssr:n}),Le(()=>{const{defaultScrollIndex:d,defaultScrollKey:x}=e;d!=null?W({index:d}):x!=null&&W({key:x})});let o=!1,l=!1;fn(()=>{if(o=!1,!l){l=!0;return}W({top:S.value,left:h.value})}),hn(()=>{o=!0,l||(l=!0)});const i=ye(()=>{if(e.renderCol==null&&e.renderItemWithCols==null||e.columns.length===0)return;let d=0;return e.columns.forEach(x=>{d+=x.width}),d}),f=A(()=>{const d=new Map,{keyField:x}=e;return e.items.forEach(($,L)=>{d.set($[x],L)}),d}),{scrollLeftRef:h,listWidthRef:r}=jn({columnsRef:ee(e,"columns"),renderColRef:ee(e,"renderCol"),renderItemWithColsRef:ee(e,"renderItemWithCols")}),p=M(null),m=M(void 0),w=new Map,C=A(()=>{const{items:d,itemSize:x,keyField:$}=e,L=new Bt(d.length,x);return d.forEach((V,G)=>{const H=V[$],U=w.get(H);U!==void 0&&L.add(G,U)}),L}),I=M(0),S=M(0),b=ye(()=>Math.max(C.value.getBound(S.value-rt(e.paddingTop))-1,0)),k=A(()=>{const{value:d}=m;if(d===void 0)return[];const{items:x,itemSize:$}=e,L=b.value,V=Math.min(L+Math.ceil(d/$+1),x.length-1),G=[];for(let H=L;H<=V;++H)G.push(x[H]);return G}),W=(d,x)=>{if(typeof d=="number"){N(d,x,"auto");return}const{left:$,top:L,index:V,key:G,position:H,behavior:U,debounce:q=!0}=d;if($!==void 0||L!==void 0)N($,L,U);else if(V!==void 0)O(V,U,q);else if(G!==void 0){const ne=f.value.get(G);ne!==void 0&&O(ne,U,q)}else H==="bottom"?N(0,Number.MAX_SAFE_INTEGER,U):H==="top"&&N(0,0,U)};let T,R=null;function O(d,x,$){const{value:L}=C,V=L.sum(d)+rt(e.paddingTop);if(!$)p.value.scrollTo({left:0,top:V,behavior:x});else{T=d,R!==null&&window.clearTimeout(R),R=window.setTimeout(()=>{T=void 0,R=null},16);const{scrollTop:G,offsetHeight:H}=p.value;if(V>G){const U=L.get(d);V+U<=G+H||p.value.scrollTo({left:0,top:V+U-H,behavior:x})}else p.value.scrollTo({left:0,top:V,behavior:x})}}function N(d,x,$){p.value.scrollTo({left:d,top:x,behavior:$})}function D(d,x){var $,L,V;if(o||e.ignoreItemResize||te(x.target))return;const{value:G}=C,H=f.value.get(d),U=G.get(H),q=(V=(L=($=x.borderBoxSize)===null||$===void 0?void 0:$[0])===null||L===void 0?void 0:L.blockSize)!==null&&V!==void 0?V:x.contentRect.height;if(q===U)return;q-e.itemSize===0?w.delete(d):w.set(d,q-e.itemSize);const ie=q-U;if(ie===0)return;G.add(H,ie);const a=p.value;if(a!=null){if(T===void 0){const v=G.sum(H);a.scrollTop>v&&a.scrollBy(0,ie)}else if(H<T)a.scrollBy(0,ie);else if(H===T){const v=G.sum(H);q+v>a.scrollTop+a.offsetHeight&&a.scrollBy(0,ie)}Z()}I.value++}const E=!Vn();let K=!1;function Q(d){var x;(x=e.onScroll)===null||x===void 0||x.call(e,d),(!E||!K)&&Z()}function oe(d){var x;if((x=e.onWheel)===null||x===void 0||x.call(e,d),E){const $=p.value;if($!=null){if(d.deltaX===0&&($.scrollTop===0&&d.deltaY<=0||$.scrollTop+$.offsetHeight>=$.scrollHeight&&d.deltaY>=0))return;d.preventDefault(),$.scrollTop+=d.deltaY/yt(),$.scrollLeft+=d.deltaX/yt(),Z(),K=!0,vn(()=>{K=!1})}}}function le(d){if(o||te(d.target))return;if(e.renderCol==null&&e.renderItemWithCols==null){if(d.contentRect.height===m.value)return}else if(d.contentRect.height===m.value&&d.contentRect.width===r.value)return;m.value=d.contentRect.height,r.value=d.contentRect.width;const{onResize:x}=e;x!==void 0&&x(d)}function Z(){const{value:d}=p;d!=null&&(S.value=d.scrollTop,h.value=d.scrollLeft)}function te(d){let x=d;for(;x!==null;){if(x.style.display==="none")return!0;x=x.parentElement}return!1}return{listHeight:m,listStyle:{overflow:"auto"},keyToIndex:f,itemsStyle:A(()=>{const{itemResizable:d}=e,x=Ae(C.value.sum());return I.value,[e.itemsStyle,{boxSizing:"content-box",width:Ae(i.value),height:d?"":x,minHeight:d?x:"",paddingTop:Ae(e.paddingTop),paddingBottom:Ae(e.paddingBottom)}]}),visibleItemsStyle:A(()=>(I.value,{transform:`translateY(${Ae(C.value.sum(b.value))})`})),viewportItems:k,listElRef:p,itemsElRef:M(null),scrollTo:W,handleListResize:le,handleListScroll:Q,handleListWheel:oe,handleItemResize:D}},render(){const{itemResizable:e,keyField:n,keyToIndex:o,visibleItemsTag:l}=this;return u(bt,{onResize:this.handleListResize},{default:()=>{var i,f;return u("div",cn(this.$attrs,{class:["v-vl",this.showScrollbar&&"v-vl--show-scrollbar"],onScroll:this.handleListScroll,onWheel:this.handleListWheel,ref:"listElRef"}),[this.items.length!==0?u("div",{ref:"itemsElRef",class:"v-vl-items",style:this.itemsStyle},[u(l,Object.assign({class:"v-vl-visible-items",style:this.visibleItemsStyle},this.visibleItemsProps),{default:()=>{const{renderCol:h,renderItemWithCols:r}=this;return this.viewportItems.map(p=>{const m=p[n],w=o.get(m),C=h!=null?u(Ct,{index:w,item:p}):void 0,I=r!=null?u(Ct,{index:w,item:p}):void 0,S=this.$slots.default({item:p,renderedCols:C,renderedItemWithCols:I,index:w})[0];return e?u(bt,{key:m,onResize:b=>this.handleItemResize(m,b)},{default:()=>S}):(S.key=m,S)})}})]):(f=(i=this.$slots).empty)===null||f===void 0?void 0:f.call(i)])}})}}),ge="v-hidden",qn=qe("[v-hidden]",{display:"none!important"}),St=he({name:"Overflow",props:{getCounter:Function,getTail:Function,updateCounter:Function,onUpdateCount:Function,onUpdateOverflow:Function},setup(e,{slots:n}){const o=M(null),l=M(null);function i(h){const{value:r}=o,{getCounter:p,getTail:m}=e;let w;if(p!==void 0?w=p():w=l.value,!r||!w)return;w.hasAttribute(ge)&&w.removeAttribute(ge);const{children:C}=r;if(h.showAllItemsBeforeCalculate)for(const O of C)O.hasAttribute(ge)&&O.removeAttribute(ge);const I=r.offsetWidth,S=[],b=n.tail?m==null?void 0:m():null;let k=b?b.offsetWidth:0,W=!1;const T=r.children.length-(n.tail?1:0);for(let O=0;O<T-1;++O){if(O<0)continue;const N=C[O];if(W){N.hasAttribute(ge)||N.setAttribute(ge,"");continue}else N.hasAttribute(ge)&&N.removeAttribute(ge);const D=N.offsetWidth;if(k+=D,S[O]=D,k>I){const{updateCounter:E}=e;for(let K=O;K>=0;--K){const Q=T-1-K;E!==void 0?E(Q):w.textContent=`${Q}`;const oe=w.offsetWidth;if(k-=S[K],k+oe<=I||K===0){W=!0,O=K-1,b&&(O===-1?(b.style.maxWidth=`${I-oe}px`,b.style.boxSizing="border-box"):b.style.maxWidth="");const{onUpdateCount:le}=e;le&&le(Q);break}}}}const{onUpdateOverflow:R}=e;W?R!==void 0&&R(!0):(R!==void 0&&R(!1),w.setAttribute(ge,""))}const f=Ot();return qn.mount({id:"vueuc/overflow",head:!0,anchorMetaName:zt,ssr:f}),Le(()=>i({showAllItemsBeforeCalculate:!1})),{selfRef:o,counterRef:l,sync:i}},render(){const{$slots:e}=this;return ut(()=>this.sync({showAllItemsBeforeCalculate:!1})),u("div",{class:"v-overflow",ref:"selfRef"},[gn(e,"default"),e.counter?e.counter():u("span",{style:{display:"inline-block"},ref:"counterRef"}),e.tail?e.tail():null])}});function _t(e,n){n&&(Le(()=>{const{value:o}=e;o&&et.registerHandler(o,n)}),Ce(e,(o,l)=>{l&&et.unregisterHandler(l)},{deep:!1}),Mt(()=>{const{value:o}=e;o&&et.unregisterHandler(o)}))}function Rt(e){switch(typeof e){case"string":return e||void 0;case"number":return String(e);default:return}}function ot(e){const n=e.filter(o=>o!==void 0);if(n.length!==0)return n.length===1?n[0]:o=>{e.forEach(l=>{l&&l(o)})}}const Gn=he({name:"Checkmark",render(){return u("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},u("g",{fill:"none"},u("path",{d:"M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",fill:"currentColor"})))}}),Xn=he({props:{onFocus:Function,onBlur:Function},setup(e){return()=>u("div",{style:"width: 0; height: 0",tabindex:0,onFocus:e.onFocus,onBlur:e.onBlur})}}),Yn={height:"calc(var(--n-option-height) * 7.6)",paddingTiny:"4px 0",paddingSmall:"4px 0",paddingMedium:"4px 0",paddingLarge:"4px 0",paddingHuge:"4px 0",optionPaddingTiny:"0 12px",optionPaddingSmall:"0 12px",optionPaddingMedium:"0 12px",optionPaddingLarge:"0 12px",optionPaddingHuge:"0 12px",loadingSize:"18px"};function Qn(e){const{borderRadius:n,popoverColor:o,textColor3:l,dividerColor:i,textColor2:f,primaryColorPressed:h,textColorDisabled:r,primaryColor:p,opacityDisabled:m,hoverColor:w,fontSizeTiny:C,fontSizeSmall:I,fontSizeMedium:S,fontSizeLarge:b,fontSizeHuge:k,heightTiny:W,heightSmall:T,heightMedium:R,heightLarge:O,heightHuge:N}=e;return Object.assign(Object.assign({},Yn),{optionFontSizeTiny:C,optionFontSizeSmall:I,optionFontSizeMedium:S,optionFontSizeLarge:b,optionFontSizeHuge:k,optionHeightTiny:W,optionHeightSmall:T,optionHeightMedium:R,optionHeightLarge:O,optionHeightHuge:N,borderRadius:n,color:o,groupHeaderTextColor:l,actionDividerColor:i,optionTextColor:f,optionTextColorPressed:h,optionTextColorDisabled:r,optionTextColorActive:p,optionOpacityDisabled:m,optionCheckColor:p,optionColorPending:w,optionColorActive:"rgba(0, 0, 0, 0)",optionColorActivePending:w,actionTextColor:f,loadingColor:p})}const At=ct({name:"InternalSelectMenu",common:ft,peers:{Scrollbar:bn,Empty:Dn},self:Qn}),Ft=he({name:"NBaseSelectGroupHeader",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(){const{renderLabelRef:e,renderOptionRef:n,labelFieldRef:o,nodePropsRef:l}=dt(ht);return{labelField:o,nodeProps:l,renderLabel:e,renderOption:n}},render(){const{clsPrefix:e,renderLabel:n,renderOption:o,nodeProps:l,tmNode:{rawNode:i}}=this,f=l==null?void 0:l(i),h=n?n(i,!1):ze(i[this.labelField],i,!1),r=u("div",Object.assign({},f,{class:[`${e}-base-select-group-header`,f==null?void 0:f.class]}),h);return i.render?i.render({node:r,option:i}):o?o({node:r,option:i,selected:!1}):r}});function Jn(e,n){return u(Pt,{name:"fade-in-scale-up-transition"},{default:()=>e?u(pn,{clsPrefix:n,class:`${n}-base-select-option__check`},{default:()=>u(Gn)}):null})}const Tt=he({name:"NBaseSelectOption",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(e){const{valueRef:n,pendingTmNodeRef:o,multipleRef:l,valueSetRef:i,renderLabelRef:f,renderOptionRef:h,labelFieldRef:r,valueFieldRef:p,showCheckmarkRef:m,nodePropsRef:w,handleOptionClick:C,handleOptionMouseEnter:I}=dt(ht),S=ye(()=>{const{value:T}=o;return T?e.tmNode.key===T.key:!1});function b(T){const{tmNode:R}=e;R.disabled||C(T,R)}function k(T){const{tmNode:R}=e;R.disabled||I(T,R)}function W(T){const{tmNode:R}=e,{value:O}=S;R.disabled||O||I(T,R)}return{multiple:l,isGrouped:ye(()=>{const{tmNode:T}=e,{parent:R}=T;return R&&R.rawNode.type==="group"}),showCheckmark:m,nodeProps:w,isPending:S,isSelected:ye(()=>{const{value:T}=n,{value:R}=l;if(T===null)return!1;const O=e.tmNode.rawNode[p.value];if(R){const{value:N}=i;return N.has(O)}else return T===O}),labelField:r,renderLabel:f,renderOption:h,handleMouseMove:W,handleMouseEnter:k,handleClick:b}},render(){const{clsPrefix:e,tmNode:{rawNode:n},isSelected:o,isPending:l,isGrouped:i,showCheckmark:f,nodeProps:h,renderOption:r,renderLabel:p,handleClick:m,handleMouseEnter:w,handleMouseMove:C}=this,I=Jn(o,e),S=p?[p(n,o),f&&I]:[ze(n[this.labelField],n,o),f&&I],b=h==null?void 0:h(n),k=u("div",Object.assign({},b,{class:[`${e}-base-select-option`,n.class,b==null?void 0:b.class,{[`${e}-base-select-option--disabled`]:n.disabled,[`${e}-base-select-option--selected`]:o,[`${e}-base-select-option--grouped`]:i,[`${e}-base-select-option--pending`]:l,[`${e}-base-select-option--show-checkmark`]:f}],style:[(b==null?void 0:b.style)||"",n.style||""],onClick:ot([m,b==null?void 0:b.onClick]),onMouseenter:ot([w,b==null?void 0:b.onMouseenter]),onMousemove:ot([C,b==null?void 0:b.onMousemove])}),u("div",{class:`${e}-base-select-option__content`},S));return n.render?n.render({node:k,option:n,selected:o}):r?r({node:k,option:n,selected:o}):k}}),Zn=_("base-select-menu",`
 line-height: 1.5;
 outline: none;
 z-index: 0;
 position: relative;
 border-radius: var(--n-border-radius);
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-color);
`,[_("scrollbar",`
 max-height: var(--n-height);
 `),_("virtual-list",`
 max-height: var(--n-height);
 `),_("base-select-option",`
 min-height: var(--n-option-height);
 font-size: var(--n-option-font-size);
 display: flex;
 align-items: center;
 `,[j("content",`
 z-index: 1;
 white-space: nowrap;
 text-overflow: ellipsis;
 overflow: hidden;
 `)]),_("base-select-group-header",`
 min-height: var(--n-option-height);
 font-size: .93em;
 display: flex;
 align-items: center;
 `),_("base-select-menu-option-wrapper",`
 position: relative;
 width: 100%;
 `),j("loading, empty",`
 display: flex;
 padding: 12px 32px;
 flex: 1;
 justify-content: center;
 `),j("loading",`
 color: var(--n-loading-color);
 font-size: var(--n-loading-size);
 `),j("header",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-bottom: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),j("action",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-top: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),_("base-select-group-header",`
 position: relative;
 cursor: default;
 padding: var(--n-option-padding);
 color: var(--n-group-header-text-color);
 `),_("base-select-option",`
 cursor: pointer;
 position: relative;
 padding: var(--n-option-padding);
 transition:
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 box-sizing: border-box;
 color: var(--n-option-text-color);
 opacity: 1;
 `,[ae("show-checkmark",`
 padding-right: calc(var(--n-option-padding-right) + 20px);
 `),fe("&::before",`
 content: "";
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),fe("&:active",`
 color: var(--n-option-text-color-pressed);
 `),ae("grouped",`
 padding-left: calc(var(--n-option-padding-left) * 1.5);
 `),ae("pending",[fe("&::before",`
 background-color: var(--n-option-color-pending);
 `)]),ae("selected",`
 color: var(--n-option-text-color-active);
 `,[fe("&::before",`
 background-color: var(--n-option-color-active);
 `),ae("pending",[fe("&::before",`
 background-color: var(--n-option-color-active-pending);
 `)])]),ae("disabled",`
 cursor: not-allowed;
 `,[at("selected",`
 color: var(--n-option-text-color-disabled);
 `),ae("selected",`
 opacity: var(--n-option-opacity-disabled);
 `)]),j("check",`
 font-size: 16px;
 position: absolute;
 right: calc(var(--n-option-padding-right) - 4px);
 top: calc(50% - 7px);
 color: var(--n-option-check-color);
 transition: color .3s var(--n-bezier);
 `,[It({enterScale:"0.5"})])])]),eo=he({name:"InternalSelectMenu",props:Object.assign(Object.assign({},Me.props),{clsPrefix:{type:String,required:!0},scrollable:{type:Boolean,default:!0},treeMate:{type:Object,required:!0},multiple:Boolean,size:{type:String,default:"medium"},value:{type:[String,Number,Array],default:null},autoPending:Boolean,virtualScroll:{type:Boolean,default:!0},show:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},loading:Boolean,focusable:Boolean,renderLabel:Function,renderOption:Function,nodeProps:Function,showCheckmark:{type:Boolean,default:!0},onMousedown:Function,onScroll:Function,onFocus:Function,onBlur:Function,onKeyup:Function,onKeydown:Function,onTabOut:Function,onMouseenter:Function,onMouseleave:Function,onResize:Function,resetMenuOnOptionsChange:{type:Boolean,default:!0},inlineThemeDisabled:Boolean,scrollbarProps:Object,onToggle:Function}),setup(e){const{mergedClsPrefixRef:n,mergedRtlRef:o,mergedComponentPropsRef:l}=vt(e),i=kt("InternalSelectMenu",o,n),f=Me("InternalSelectMenu","-internal-select-menu",Zn,At,e,ee(e,"clsPrefix")),h=M(null),r=M(null),p=M(null),m=A(()=>e.treeMate.getFlattenedNodes()),w=A(()=>yn(m.value)),C=M(null);function I(){const{treeMate:a}=e;let v=null;const{value:X}=e;X===null?v=a.getFirstAvailableNode():(e.multiple?v=a.getNode((X||[])[(X||[]).length-1]):v=a.getNode(X),(!v||v.disabled)&&(v=a.getFirstAvailableNode())),L(v||null)}function S(){const{value:a}=C;a&&!e.treeMate.getNode(a.key)&&(C.value=null)}let b;Ce(()=>e.show,a=>{a?b=Ce(()=>e.treeMate,()=>{e.resetMenuOnOptionsChange?(e.autoPending?I():S(),ut(V)):S()},{immediate:!0}):b==null||b()},{immediate:!0}),Mt(()=>{b==null||b()});const k=A(()=>rt(f.value.self[xe("optionHeight",e.size)])),W=A(()=>Ne(f.value.self[xe("padding",e.size)])),T=A(()=>e.multiple&&Array.isArray(e.value)?new Set(e.value):new Set),R=A(()=>{const a=m.value;return a&&a.length===0}),O=A(()=>{var a,v;return(v=(a=l==null?void 0:l.value)===null||a===void 0?void 0:a.Select)===null||v===void 0?void 0:v.renderEmpty});function N(a){const{onToggle:v}=e;v&&v(a)}function D(a){const{onScroll:v}=e;v&&v(a)}function E(a){var v;(v=p.value)===null||v===void 0||v.sync(),D(a)}function K(){var a;(a=p.value)===null||a===void 0||a.sync()}function Q(){const{value:a}=C;return a||null}function oe(a,v){v.disabled||L(v,!1)}function le(a,v){v.disabled||N(v)}function Z(a){var v;Ee(a,"action")||(v=e.onKeyup)===null||v===void 0||v.call(e,a)}function te(a){var v;Ee(a,"action")||(v=e.onKeydown)===null||v===void 0||v.call(e,a)}function d(a){var v;(v=e.onMousedown)===null||v===void 0||v.call(e,a),!e.focusable&&a.preventDefault()}function x(){const{value:a}=C;a&&L(a.getNext({loop:!0}),!0)}function $(){const{value:a}=C;a&&L(a.getPrev({loop:!0}),!0)}function L(a,v=!1){C.value=a,v&&V()}function V(){var a,v;const X=C.value;if(!X)return;const de=w.value(X.key);de!==null&&(e.virtualScroll?(a=r.value)===null||a===void 0||a.scrollTo({index:de}):(v=p.value)===null||v===void 0||v.scrollTo({index:de,elSize:k.value}))}function G(a){var v,X;!((v=h.value)===null||v===void 0)&&v.contains(a.target)&&((X=e.onFocus)===null||X===void 0||X.call(e,a))}function H(a){var v,X;!((v=h.value)===null||v===void 0)&&v.contains(a.relatedTarget)||(X=e.onBlur)===null||X===void 0||X.call(e,a)}it(ht,{handleOptionMouseEnter:oe,handleOptionClick:le,valueSetRef:T,pendingTmNodeRef:C,nodePropsRef:ee(e,"nodeProps"),showCheckmarkRef:ee(e,"showCheckmark"),multipleRef:ee(e,"multiple"),valueRef:ee(e,"value"),renderLabelRef:ee(e,"renderLabel"),renderOptionRef:ee(e,"renderOption"),labelFieldRef:ee(e,"labelField"),valueFieldRef:ee(e,"valueField")}),it(Cn,h),Le(()=>{const{value:a}=p;a&&a.sync()});const U=A(()=>{const{size:a}=e,{common:{cubicBezierEaseInOut:v},self:{height:X,borderRadius:de,color:Se,groupHeaderTextColor:ve,actionDividerColor:re,optionTextColorPressed:Re,optionTextColor:be,optionTextColorDisabled:Pe,optionTextColorActive:Ie,optionOpacityDisabled:ke,optionCheckColor:me,actionTextColor:we,optionColorPending:Be,optionColorActive:$e,loadingColor:_e,loadingSize:Fe,optionColorActivePending:Te,[xe("optionFontSize",a)]:se,[xe("optionHeight",a)]:s,[xe("optionPadding",a)]:g}}=f.value;return{"--n-height":X,"--n-action-divider-color":re,"--n-action-text-color":we,"--n-bezier":v,"--n-border-radius":de,"--n-color":Se,"--n-option-font-size":se,"--n-group-header-text-color":ve,"--n-option-check-color":me,"--n-option-color-pending":Be,"--n-option-color-active":$e,"--n-option-color-active-pending":Te,"--n-option-height":s,"--n-option-opacity-disabled":ke,"--n-option-text-color":be,"--n-option-text-color-active":Ie,"--n-option-text-color-disabled":Pe,"--n-option-text-color-pressed":Re,"--n-option-padding":g,"--n-option-padding-left":Ne(g,"left"),"--n-option-padding-right":Ne(g,"right"),"--n-loading-color":_e,"--n-loading-size":Fe}}),{inlineThemeDisabled:q}=e,ne=q?gt("internal-select-menu",A(()=>e.size[0]),U,e):void 0,ie={selfRef:h,next:x,prev:$,getPendingTmNode:Q};return _t(h,e.onResize),Object.assign({mergedTheme:f,mergedClsPrefix:n,rtlEnabled:i,virtualListRef:r,scrollbarRef:p,itemSize:k,padding:W,flattenedNodes:m,empty:R,mergedRenderEmpty:O,virtualListContainer(){const{value:a}=r;return a==null?void 0:a.listElRef},virtualListContent(){const{value:a}=r;return a==null?void 0:a.itemsElRef},doScroll:D,handleFocusin:G,handleFocusout:H,handleKeyUp:Z,handleKeyDown:te,handleMouseDown:d,handleVirtualListResize:K,handleVirtualListScroll:E,cssVars:q?void 0:U,themeClass:ne==null?void 0:ne.themeClass,onRender:ne==null?void 0:ne.onRender},ie)},render(){const{$slots:e,virtualScroll:n,clsPrefix:o,mergedTheme:l,themeClass:i,onRender:f}=this;return f==null||f(),u("div",{ref:"selfRef",tabindex:this.focusable?0:-1,class:[`${o}-base-select-menu`,`${o}-base-select-menu--${this.size}-size`,this.rtlEnabled&&`${o}-base-select-menu--rtl`,i,this.multiple&&`${o}-base-select-menu--multiple`],style:this.cssVars,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onKeyup:this.handleKeyUp,onKeydown:this.handleKeyDown,onMousedown:this.handleMouseDown,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},pt(e.header,h=>h&&u("div",{class:`${o}-base-select-menu__header`,"data-header":!0,key:"header"},h)),this.loading?u("div",{class:`${o}-base-select-menu__loading`},u(mn,{clsPrefix:o,strokeWidth:20})):this.empty?u("div",{class:`${o}-base-select-menu__empty`,"data-empty":!0},xn(e.empty,()=>{var h;return[((h=this.mergedRenderEmpty)===null||h===void 0?void 0:h.call(this))||u(Hn,{theme:l.peers.Empty,themeOverrides:l.peerOverrides.Empty,size:this.size})]})):u(wn,Object.assign({ref:"scrollbarRef",theme:l.peers.Scrollbar,themeOverrides:l.peerOverrides.Scrollbar,scrollable:this.scrollable,container:n?this.virtualListContainer:void 0,content:n?this.virtualListContent:void 0,onScroll:n?void 0:this.doScroll},this.scrollbarProps),{default:()=>n?u(Un,{ref:"virtualListRef",class:`${o}-virtual-list`,items:this.flattenedNodes,itemSize:this.itemSize,showScrollbar:!1,paddingTop:this.padding.top,paddingBottom:this.padding.bottom,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemResizable:!0},{default:({item:h})=>h.isGroup?u(Ft,{key:h.key,clsPrefix:o,tmNode:h}):h.ignored?null:u(Tt,{clsPrefix:o,key:h.key,tmNode:h})}):u("div",{class:`${o}-base-select-menu-option-wrapper`,style:{paddingTop:this.padding.top,paddingBottom:this.padding.bottom}},this.flattenedNodes.map(h=>h.isGroup?u(Ft,{key:h.key,clsPrefix:o,tmNode:h}):u(Tt,{clsPrefix:o,key:h.key,tmNode:h})))}),pt(e.action,h=>h&&[u("div",{class:`${o}-base-select-menu__action`,"data-action":!0,key:"action"},h),u(Xn,{onFocus:this.onTabOut,key:"focus-detector"})]))}}),to={paddingSingle:"0 26px 0 12px",paddingMultiple:"3px 26px 0 12px",clearSize:"16px",arrowSize:"16px"};function no(e){const{borderRadius:n,textColor2:o,textColorDisabled:l,inputColor:i,inputColorDisabled:f,primaryColor:h,primaryColorHover:r,warningColor:p,warningColorHover:m,errorColor:w,errorColorHover:C,borderColor:I,iconColor:S,iconColorDisabled:b,clearColor:k,clearColorHover:W,clearColorPressed:T,placeholderColor:R,placeholderColorDisabled:O,fontSizeTiny:N,fontSizeSmall:D,fontSizeMedium:E,fontSizeLarge:K,heightTiny:Q,heightSmall:oe,heightMedium:le,heightLarge:Z,fontWeight:te}=e;return Object.assign(Object.assign({},to),{fontSizeTiny:N,fontSizeSmall:D,fontSizeMedium:E,fontSizeLarge:K,heightTiny:Q,heightSmall:oe,heightMedium:le,heightLarge:Z,borderRadius:n,fontWeight:te,textColor:o,textColorDisabled:l,placeholderColor:R,placeholderColorDisabled:O,color:i,colorDisabled:f,colorActive:i,border:`1px solid ${I}`,borderHover:`1px solid ${r}`,borderActive:`1px solid ${h}`,borderFocus:`1px solid ${r}`,boxShadowHover:"none",boxShadowActive:`0 0 0 2px ${Oe(h,{alpha:.2})}`,boxShadowFocus:`0 0 0 2px ${Oe(h,{alpha:.2})}`,caretColor:h,arrowColor:S,arrowColorDisabled:b,loadingColor:h,borderWarning:`1px solid ${p}`,borderHoverWarning:`1px solid ${m}`,borderActiveWarning:`1px solid ${p}`,borderFocusWarning:`1px solid ${m}`,boxShadowHoverWarning:"none",boxShadowActiveWarning:`0 0 0 2px ${Oe(p,{alpha:.2})}`,boxShadowFocusWarning:`0 0 0 2px ${Oe(p,{alpha:.2})}`,colorActiveWarning:i,caretColorWarning:p,borderError:`1px solid ${w}`,borderHoverError:`1px solid ${C}`,borderActiveError:`1px solid ${w}`,borderFocusError:`1px solid ${C}`,boxShadowHoverError:"none",boxShadowActiveError:`0 0 0 2px ${Oe(w,{alpha:.2})}`,boxShadowFocusError:`0 0 0 2px ${Oe(w,{alpha:.2})}`,colorActiveError:i,caretColorError:w,clearColor:k,clearColorHover:W,clearColorPressed:T})}const Et=ct({name:"InternalSelection",common:ft,peers:{Popover:Sn},self:no}),oo=fe([_("base-selection",`
 --n-padding-single: var(--n-padding-single-top) var(--n-padding-single-right) var(--n-padding-single-bottom) var(--n-padding-single-left);
 --n-padding-multiple: var(--n-padding-multiple-top) var(--n-padding-multiple-right) var(--n-padding-multiple-bottom) var(--n-padding-multiple-left);
 position: relative;
 z-index: auto;
 box-shadow: none;
 width: 100%;
 max-width: 100%;
 display: inline-block;
 vertical-align: bottom;
 border-radius: var(--n-border-radius);
 min-height: var(--n-height);
 line-height: 1.5;
 font-size: var(--n-font-size);
 `,[_("base-loading",`
 color: var(--n-loading-color);
 `),_("base-selection-tags","min-height: var(--n-height);"),j("border, state-border",`
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 pointer-events: none;
 border: var(--n-border);
 border-radius: inherit;
 transition:
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `),j("state-border",`
 z-index: 1;
 border-color: #0000;
 `),_("base-suffix",`
 cursor: pointer;
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 right: 10px;
 `,[j("arrow",`
 font-size: var(--n-arrow-size);
 color: var(--n-arrow-color);
 transition: color .3s var(--n-bezier);
 `)]),_("base-selection-overlay",`
 display: flex;
 align-items: center;
 white-space: nowrap;
 pointer-events: none;
 position: absolute;
 top: 0;
 right: 0;
 bottom: 0;
 left: 0;
 padding: var(--n-padding-single);
 transition: color .3s var(--n-bezier);
 `,[j("wrapper",`
 flex-basis: 0;
 flex-grow: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 `)]),_("base-selection-placeholder",`
 color: var(--n-placeholder-color);
 `,[j("inner",`
 max-width: 100%;
 overflow: hidden;
 `)]),_("base-selection-tags",`
 cursor: pointer;
 outline: none;
 box-sizing: border-box;
 position: relative;
 z-index: auto;
 display: flex;
 padding: var(--n-padding-multiple);
 flex-wrap: wrap;
 align-items: center;
 width: 100%;
 vertical-align: bottom;
 background-color: var(--n-color);
 border-radius: inherit;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 `),_("base-selection-label",`
 height: var(--n-height);
 display: inline-flex;
 width: 100%;
 vertical-align: bottom;
 cursor: pointer;
 outline: none;
 z-index: auto;
 box-sizing: border-box;
 position: relative;
 transition:
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 border-radius: inherit;
 background-color: var(--n-color);
 align-items: center;
 `,[_("base-selection-input",`
 font-size: inherit;
 line-height: inherit;
 outline: none;
 cursor: pointer;
 box-sizing: border-box;
 border:none;
 width: 100%;
 padding: var(--n-padding-single);
 background-color: #0000;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 caret-color: var(--n-caret-color);
 `,[j("content",`
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap; 
 `)]),j("render-label",`
 color: var(--n-text-color);
 `)]),at("disabled",[fe("&:hover",[j("state-border",`
 box-shadow: var(--n-box-shadow-hover);
 border: var(--n-border-hover);
 `)]),ae("focus",[j("state-border",`
 box-shadow: var(--n-box-shadow-focus);
 border: var(--n-border-focus);
 `)]),ae("active",[j("state-border",`
 box-shadow: var(--n-box-shadow-active);
 border: var(--n-border-active);
 `),_("base-selection-label","background-color: var(--n-color-active);"),_("base-selection-tags","background-color: var(--n-color-active);")])]),ae("disabled","cursor: not-allowed;",[j("arrow",`
 color: var(--n-arrow-color-disabled);
 `),_("base-selection-label",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `,[_("base-selection-input",`
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 `),j("render-label",`
 color: var(--n-text-color-disabled);
 `)]),_("base-selection-tags",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `),_("base-selection-placeholder",`
 cursor: not-allowed;
 color: var(--n-placeholder-color-disabled);
 `)]),_("base-selection-input-tag",`
 height: calc(var(--n-height) - 6px);
 line-height: calc(var(--n-height) - 6px);
 outline: none;
 display: none;
 position: relative;
 margin-bottom: 3px;
 max-width: 100%;
 vertical-align: bottom;
 `,[j("input",`
 font-size: inherit;
 font-family: inherit;
 min-width: 1px;
 padding: 0;
 background-color: #0000;
 outline: none;
 border: none;
 max-width: 100%;
 overflow: hidden;
 width: 1em;
 line-height: inherit;
 cursor: pointer;
 color: var(--n-text-color);
 caret-color: var(--n-caret-color);
 `),j("mirror",`
 position: absolute;
 left: 0;
 top: 0;
 white-space: pre;
 visibility: hidden;
 user-select: none;
 -webkit-user-select: none;
 opacity: 0;
 `)]),["warning","error"].map(e=>ae(`${e}-status`,[j("state-border",`border: var(--n-border-${e});`),at("disabled",[fe("&:hover",[j("state-border",`
 box-shadow: var(--n-box-shadow-hover-${e});
 border: var(--n-border-hover-${e});
 `)]),ae("active",[j("state-border",`
 box-shadow: var(--n-box-shadow-active-${e});
 border: var(--n-border-active-${e});
 `),_("base-selection-label",`background-color: var(--n-color-active-${e});`),_("base-selection-tags",`background-color: var(--n-color-active-${e});`)]),ae("focus",[j("state-border",`
 box-shadow: var(--n-box-shadow-focus-${e});
 border: var(--n-border-focus-${e});
 `)])])]))]),_("base-selection-popover",`
 margin-bottom: -3px;
 display: flex;
 flex-wrap: wrap;
 margin-right: -8px;
 `),_("base-selection-tag-wrapper",`
 max-width: 100%;
 display: inline-flex;
 padding: 0 7px 3px 0;
 `,[fe("&:last-child","padding-right: 0;"),_("tag",`
 font-size: 14px;
 max-width: 100%;
 `,[j("content",`
 line-height: 1.25;
 text-overflow: ellipsis;
 overflow: hidden;
 `)])])]),lo=he({name:"InternalSelection",props:Object.assign(Object.assign({},Me.props),{clsPrefix:{type:String,required:!0},bordered:{type:Boolean,default:void 0},active:Boolean,pattern:{type:String,default:""},placeholder:String,selectedOption:{type:Object,default:null},selectedOptions:{type:Array,default:null},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},multiple:Boolean,filterable:Boolean,clearable:Boolean,disabled:Boolean,size:{type:String,default:"medium"},loading:Boolean,autofocus:Boolean,showArrow:{type:Boolean,default:!0},inputProps:Object,focused:Boolean,renderTag:Function,onKeydown:Function,onClick:Function,onBlur:Function,onFocus:Function,onDeleteOption:Function,maxTagCount:[String,Number],ellipsisTagPopoverProps:Object,onClear:Function,onPatternInput:Function,onPatternFocus:Function,onPatternBlur:Function,renderLabel:Function,status:String,inlineThemeDisabled:Boolean,ignoreComposition:{type:Boolean,default:!0},onResize:Function}),setup(e){const{mergedClsPrefixRef:n,mergedRtlRef:o}=vt(e),l=kt("InternalSelection",o,n),i=M(null),f=M(null),h=M(null),r=M(null),p=M(null),m=M(null),w=M(null),C=M(null),I=M(null),S=M(null),b=M(!1),k=M(!1),W=M(!1),T=Me("InternalSelection","-internal-selection",oo,Et,e,ee(e,"clsPrefix")),R=A(()=>e.clearable&&!e.disabled&&(W.value||e.active)),O=A(()=>e.selectedOption?e.renderTag?e.renderTag({option:e.selectedOption,handleClose:()=>{}}):e.renderLabel?e.renderLabel(e.selectedOption,!0):ze(e.selectedOption[e.labelField],e.selectedOption,!0):e.placeholder),N=A(()=>{const s=e.selectedOption;if(s)return s[e.labelField]}),D=A(()=>e.multiple?!!(Array.isArray(e.selectedOptions)&&e.selectedOptions.length):e.selectedOption!==null);function E(){var s;const{value:g}=i;if(g){const{value:Y}=f;Y&&(Y.style.width=`${g.offsetWidth}px`,e.maxTagCount!=="responsive"&&((s=I.value)===null||s===void 0||s.sync({showAllItemsBeforeCalculate:!1})))}}function K(){const{value:s}=S;s&&(s.style.display="none")}function Q(){const{value:s}=S;s&&(s.style.display="inline-block")}Ce(ee(e,"active"),s=>{s||K()}),Ce(ee(e,"pattern"),()=>{e.multiple&&ut(E)});function oe(s){const{onFocus:g}=e;g&&g(s)}function le(s){const{onBlur:g}=e;g&&g(s)}function Z(s){const{onDeleteOption:g}=e;g&&g(s)}function te(s){const{onClear:g}=e;g&&g(s)}function d(s){const{onPatternInput:g}=e;g&&g(s)}function x(s){var g;(!s.relatedTarget||!(!((g=h.value)===null||g===void 0)&&g.contains(s.relatedTarget)))&&oe(s)}function $(s){var g;!((g=h.value)===null||g===void 0)&&g.contains(s.relatedTarget)||le(s)}function L(s){te(s)}function V(){W.value=!0}function G(){W.value=!1}function H(s){!e.active||!e.filterable||s.target!==f.value&&s.preventDefault()}function U(s){Z(s)}const q=M(!1);function ne(s){if(s.key==="Backspace"&&!q.value&&!e.pattern.length){const{selectedOptions:g}=e;g!=null&&g.length&&U(g[g.length-1])}}let ie=null;function a(s){const{value:g}=i;if(g){const Y=s.target.value;g.textContent=Y,E()}e.ignoreComposition&&q.value?ie=s:d(s)}function v(){q.value=!0}function X(){q.value=!1,e.ignoreComposition&&d(ie),ie=null}function de(s){var g;k.value=!0,(g=e.onPatternFocus)===null||g===void 0||g.call(e,s)}function Se(s){var g;k.value=!1,(g=e.onPatternBlur)===null||g===void 0||g.call(e,s)}function ve(){var s,g;if(e.filterable)k.value=!1,(s=m.value)===null||s===void 0||s.blur(),(g=f.value)===null||g===void 0||g.blur();else if(e.multiple){const{value:Y}=r;Y==null||Y.blur()}else{const{value:Y}=p;Y==null||Y.blur()}}function re(){var s,g,Y;e.filterable?(k.value=!1,(s=m.value)===null||s===void 0||s.focus()):e.multiple?(g=r.value)===null||g===void 0||g.focus():(Y=p.value)===null||Y===void 0||Y.focus()}function Re(){const{value:s}=f;s&&(Q(),s.focus())}function be(){const{value:s}=f;s&&s.blur()}function Pe(s){const{value:g}=w;g&&g.setTextContent(`+${s}`)}function Ie(){const{value:s}=C;return s}function ke(){return f.value}let me=null;function we(){me!==null&&window.clearTimeout(me)}function Be(){e.active||(we(),me=window.setTimeout(()=>{D.value&&(b.value=!0)},100))}function $e(){we()}function _e(s){s||(we(),b.value=!1)}Ce(D,s=>{s||(b.value=!1)}),Le(()=>{On(()=>{const s=m.value;s&&(e.disabled?s.removeAttribute("tabindex"):s.tabIndex=k.value?-1:0)})}),_t(h,e.onResize);const{inlineThemeDisabled:Fe}=e,Te=A(()=>{const{size:s}=e,{common:{cubicBezierEaseInOut:g},self:{fontWeight:Y,borderRadius:Xe,color:Ye,placeholderColor:Qe,textColor:We,paddingSingle:De,paddingMultiple:He,caretColor:Je,colorDisabled:Ze,textColorDisabled:Ve,placeholderColorDisabled:pe,colorActive:t,boxShadowFocus:c,boxShadowActive:y,boxShadowHover:P,border:F,borderFocus:z,borderHover:B,borderActive:J,arrowColor:ue,arrowColorDisabled:Lt,loadingColor:Wt,colorActiveWarning:Dt,boxShadowFocusWarning:Ht,boxShadowActiveWarning:Vt,boxShadowHoverWarning:jt,borderWarning:Kt,borderFocusWarning:Ut,borderHoverWarning:qt,borderActiveWarning:Gt,colorActiveError:Xt,boxShadowFocusError:Yt,boxShadowActiveError:Qt,boxShadowHoverError:Jt,borderError:Zt,borderFocusError:en,borderHoverError:tn,borderActiveError:nn,clearColor:on,clearColorHover:ln,clearColorPressed:rn,clearSize:an,arrowSize:sn,[xe("height",s)]:dn,[xe("fontSize",s)]:un}}=T.value,je=Ne(De),Ke=Ne(He);return{"--n-bezier":g,"--n-border":F,"--n-border-active":J,"--n-border-focus":z,"--n-border-hover":B,"--n-border-radius":Xe,"--n-box-shadow-active":y,"--n-box-shadow-focus":c,"--n-box-shadow-hover":P,"--n-caret-color":Je,"--n-color":Ye,"--n-color-active":t,"--n-color-disabled":Ze,"--n-font-size":un,"--n-height":dn,"--n-padding-single-top":je.top,"--n-padding-multiple-top":Ke.top,"--n-padding-single-right":je.right,"--n-padding-multiple-right":Ke.right,"--n-padding-single-left":je.left,"--n-padding-multiple-left":Ke.left,"--n-padding-single-bottom":je.bottom,"--n-padding-multiple-bottom":Ke.bottom,"--n-placeholder-color":Qe,"--n-placeholder-color-disabled":pe,"--n-text-color":We,"--n-text-color-disabled":Ve,"--n-arrow-color":ue,"--n-arrow-color-disabled":Lt,"--n-loading-color":Wt,"--n-color-active-warning":Dt,"--n-box-shadow-focus-warning":Ht,"--n-box-shadow-active-warning":Vt,"--n-box-shadow-hover-warning":jt,"--n-border-warning":Kt,"--n-border-focus-warning":Ut,"--n-border-hover-warning":qt,"--n-border-active-warning":Gt,"--n-color-active-error":Xt,"--n-box-shadow-focus-error":Yt,"--n-box-shadow-active-error":Qt,"--n-box-shadow-hover-error":Jt,"--n-border-error":Zt,"--n-border-focus-error":en,"--n-border-hover-error":tn,"--n-border-active-error":nn,"--n-clear-size":an,"--n-clear-color":on,"--n-clear-color-hover":ln,"--n-clear-color-pressed":rn,"--n-arrow-size":sn,"--n-font-weight":Y}}),se=Fe?gt("internal-selection",A(()=>e.size[0]),Te,e):void 0;return{mergedTheme:T,mergedClearable:R,mergedClsPrefix:n,rtlEnabled:l,patternInputFocused:k,filterablePlaceholder:O,label:N,selected:D,showTagsPanel:b,isComposing:q,counterRef:w,counterWrapperRef:C,patternInputMirrorRef:i,patternInputRef:f,selfRef:h,multipleElRef:r,singleElRef:p,patternInputWrapperRef:m,overflowRef:I,inputTagElRef:S,handleMouseDown:H,handleFocusin:x,handleClear:L,handleMouseEnter:V,handleMouseLeave:G,handleDeleteOption:U,handlePatternKeyDown:ne,handlePatternInputInput:a,handlePatternInputBlur:Se,handlePatternInputFocus:de,handleMouseEnterCounter:Be,handleMouseLeaveCounter:$e,handleFocusout:$,handleCompositionEnd:X,handleCompositionStart:v,onPopoverUpdateShow:_e,focus:re,focusInput:Re,blur:ve,blurInput:be,updateCounter:Pe,getCounter:Ie,getTail:ke,renderLabel:e.renderLabel,cssVars:Fe?void 0:Te,themeClass:se==null?void 0:se.themeClass,onRender:se==null?void 0:se.onRender}},render(){const{status:e,multiple:n,size:o,disabled:l,filterable:i,maxTagCount:f,bordered:h,clsPrefix:r,ellipsisTagPopoverProps:p,onRender:m,renderTag:w,renderLabel:C}=this;m==null||m();const I=f==="responsive",S=typeof f=="number",b=I||S,k=u(Rn,null,{default:()=>u(Ln,{clsPrefix:r,loading:this.loading,showArrow:this.showArrow,showClear:this.mergedClearable&&this.selected,onClear:this.handleClear},{default:()=>{var T,R;return(R=(T=this.$slots).arrow)===null||R===void 0?void 0:R.call(T)}})});let W;if(n){const{labelField:T}=this,R=d=>u("div",{class:`${r}-base-selection-tag-wrapper`,key:d.value},w?w({option:d,handleClose:()=>{this.handleDeleteOption(d)}}):u(tt,{size:o,closable:!d.disabled,disabled:l,onClose:()=>{this.handleDeleteOption(d)},internalCloseIsButtonTag:!1,internalCloseFocusable:!1},{default:()=>C?C(d,!0):ze(d[T],d,!0)})),O=()=>(S?this.selectedOptions.slice(0,f):this.selectedOptions).map(R),N=i?u("div",{class:`${r}-base-selection-input-tag`,ref:"inputTagElRef",key:"__input-tag__"},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",tabindex:-1,disabled:l,value:this.pattern,autofocus:this.autofocus,class:`${r}-base-selection-input-tag__input`,onBlur:this.handlePatternInputBlur,onFocus:this.handlePatternInputFocus,onKeydown:this.handlePatternKeyDown,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),u("span",{ref:"patternInputMirrorRef",class:`${r}-base-selection-input-tag__mirror`},this.pattern)):null,D=I?()=>u("div",{class:`${r}-base-selection-tag-wrapper`,ref:"counterWrapperRef"},u(tt,{size:o,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,onMouseleave:this.handleMouseLeaveCounter,disabled:l})):void 0;let E;if(S){const d=this.selectedOptions.length-f;d>0&&(E=u("div",{class:`${r}-base-selection-tag-wrapper`,key:"__counter__"},u(tt,{size:o,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,disabled:l},{default:()=>`+${d}`})))}const K=I?i?u(St,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,getTail:this.getTail,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:O,counter:D,tail:()=>N}):u(St,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:O,counter:D}):S&&E?O().concat(E):O(),Q=b?()=>u("div",{class:`${r}-base-selection-popover`},I?O():this.selectedOptions.map(R)):void 0,oe=b?Object.assign({show:this.showTagsPanel,trigger:"hover",overlap:!0,placement:"top",width:"trigger",onUpdateShow:this.onPopoverUpdateShow,theme:this.mergedTheme.peers.Popover,themeOverrides:this.mergedTheme.peerOverrides.Popover},p):null,Z=(this.selected?!1:this.active?!this.pattern&&!this.isComposing:!0)?u("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`},u("div",{class:`${r}-base-selection-placeholder__inner`},this.placeholder)):null,te=i?u("div",{ref:"patternInputWrapperRef",class:`${r}-base-selection-tags`},K,I?null:N,k):u("div",{ref:"multipleElRef",class:`${r}-base-selection-tags`,tabindex:l?void 0:0},K,k);W=u(Fn,null,b?u(Tn,Object.assign({},oe,{scrollable:!0,style:"max-height: calc(var(--v-target-height) * 6.6);"}),{trigger:()=>te,default:Q}):te,Z)}else if(i){const T=this.pattern||this.isComposing,R=this.active?!T:!this.selected,O=this.active?!1:this.selected;W=u("div",{ref:"patternInputWrapperRef",class:`${r}-base-selection-label`,title:this.patternInputFocused?void 0:Rt(this.label)},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",class:`${r}-base-selection-input`,value:this.active?this.pattern:"",placeholder:"",readonly:l,disabled:l,tabindex:-1,autofocus:this.autofocus,onFocus:this.handlePatternInputFocus,onBlur:this.handlePatternInputBlur,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),O?u("div",{class:`${r}-base-selection-label__render-label ${r}-base-selection-overlay`,key:"input"},u("div",{class:`${r}-base-selection-overlay__wrapper`},w?w({option:this.selectedOption,handleClose:()=>{}}):C?C(this.selectedOption,!0):ze(this.label,this.selectedOption,!0))):null,R?u("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${r}-base-selection-overlay__wrapper`},this.filterablePlaceholder)):null,k)}else W=u("div",{ref:"singleElRef",class:`${r}-base-selection-label`,tabindex:this.disabled?void 0:0},this.label!==void 0?u("div",{class:`${r}-base-selection-input`,title:Rt(this.label),key:"input"},u("div",{class:`${r}-base-selection-input__content`},w?w({option:this.selectedOption,handleClose:()=>{}}):C?C(this.selectedOption,!0):ze(this.label,this.selectedOption,!0))):u("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${r}-base-selection-placeholder__inner`},this.placeholder)),k);return u("div",{ref:"selfRef",class:[`${r}-base-selection`,this.rtlEnabled&&`${r}-base-selection--rtl`,this.themeClass,e&&`${r}-base-selection--${e}-status`,{[`${r}-base-selection--active`]:this.active,[`${r}-base-selection--selected`]:this.selected||this.active&&this.pattern,[`${r}-base-selection--disabled`]:this.disabled,[`${r}-base-selection--multiple`]:this.multiple,[`${r}-base-selection--focus`]:this.focused}],style:this.cssVars,onClick:this.onClick,onMouseenter:this.handleMouseEnter,onMouseleave:this.handleMouseLeave,onKeydown:this.onKeydown,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onMousedown:this.handleMouseDown},W,h?u("div",{class:`${r}-base-selection__border`}):null,h?u("div",{class:`${r}-base-selection__state-border`}):null)}});function Ge(e){return e.type==="group"}function Nt(e){return e.type==="ignored"}function lt(e,n){try{return!!(1+n.toString().toLowerCase().indexOf(e.trim().toLowerCase()))}catch{return!1}}function io(e,n){return{getIsGroup:Ge,getIgnored:Nt,getKey(l){return Ge(l)?l.name||l.key||"key-required":l[e]},getChildren(l){return l[n]}}}function ro(e,n,o,l){if(!n)return e;function i(f){if(!Array.isArray(f))return[];const h=[];for(const r of f)if(Ge(r)){const p=i(r[l]);p.length&&h.push(Object.assign({},r,{[l]:p}))}else{if(Nt(r))continue;n(o,r)&&h.push(r)}return h}return i(e)}function ao(e,n,o){const l=new Map;return e.forEach(i=>{Ge(i)?i[o].forEach(f=>{l.set(f[n],f)}):l.set(i[n],i)}),l}function so(e){const{boxShadow2:n}=e;return{menuBoxShadow:n}}const uo=ct({name:"Select",common:ft,peers:{InternalSelection:Et,InternalSelectMenu:At},self:so}),co=fe([_("select",`
 z-index: auto;
 outline: none;
 width: 100%;
 position: relative;
 font-weight: var(--n-font-weight);
 `),_("select-menu",`
 margin: 4px 0;
 box-shadow: var(--n-menu-box-shadow);
 `,[It({originalTransition:"background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)"})])]),fo=Object.assign(Object.assign({},Me.props),{to:st.propTo,bordered:{type:Boolean,default:void 0},clearable:Boolean,clearCreatedOptionsOnClear:{type:Boolean,default:!0},clearFilterAfterSelect:{type:Boolean,default:!0},options:{type:Array,default:()=>[]},defaultValue:{type:[String,Number,Array],default:null},keyboard:{type:Boolean,default:!0},value:[String,Number,Array],placeholder:String,menuProps:Object,multiple:Boolean,size:String,menuSize:{type:String},filterable:Boolean,disabled:{type:Boolean,default:void 0},remote:Boolean,loading:Boolean,filter:Function,placement:{type:String,default:"bottom-start"},widthMode:{type:String,default:"trigger"},tag:Boolean,onCreate:Function,fallbackOption:{type:[Function,Boolean],default:void 0},show:{type:Boolean,default:void 0},showArrow:{type:Boolean,default:!0},maxTagCount:[Number,String],ellipsisTagPopoverProps:Object,consistentMenuWidth:{type:Boolean,default:!0},virtualScroll:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},childrenField:{type:String,default:"children"},renderLabel:Function,renderOption:Function,renderTag:Function,"onUpdate:value":[Function,Array],inputProps:Object,nodeProps:Function,ignoreComposition:{type:Boolean,default:!0},showOnFocus:Boolean,onUpdateValue:[Function,Array],onBlur:[Function,Array],onClear:[Function,Array],onFocus:[Function,Array],onScroll:[Function,Array],onSearch:[Function,Array],onUpdateShow:[Function,Array],"onUpdate:show":[Function,Array],displayDirective:{type:String,default:"show"},resetMenuOnOptionsChange:{type:Boolean,default:!0},status:String,showCheckmark:{type:Boolean,default:!0},scrollbarProps:Object,onChange:[Function,Array],items:Array}),po=he({name:"Select",props:fo,slots:Object,setup(e){const{mergedClsPrefixRef:n,mergedBorderedRef:o,namespaceRef:l,inlineThemeDisabled:i,mergedComponentPropsRef:f}=vt(e),h=Me("Select","-select",co,uo,e,n),r=M(e.defaultValue),p=ee(e,"value"),m=wt(p,r),w=M(!1),C=M(""),I=En(e,["items","options"]),S=M([]),b=M([]),k=A(()=>b.value.concat(S.value).concat(I.value)),W=A(()=>{const{filter:t}=e;if(t)return t;const{labelField:c,valueField:y}=e;return(P,F)=>{if(!F)return!1;const z=F[c];if(typeof z=="string")return lt(P,z);const B=F[y];return typeof B=="string"?lt(P,B):typeof B=="number"?lt(P,String(B)):!1}}),T=A(()=>{if(e.remote)return I.value;{const{value:t}=k,{value:c}=C;return!c.length||!e.filterable?t:ro(t,W.value,c,e.childrenField)}}),R=A(()=>{const{valueField:t,childrenField:c}=e,y=io(t,c);return Nn(T.value,y)}),O=A(()=>ao(k.value,e.valueField,e.childrenField)),N=M(!1),D=wt(ee(e,"show"),N),E=M(null),K=M(null),Q=M(null),{localeRef:oe}=Wn("Select"),le=A(()=>{var t;return(t=e.placeholder)!==null&&t!==void 0?t:oe.value.placeholder}),Z=[],te=M(new Map),d=A(()=>{const{fallbackOption:t}=e;if(t===void 0){const{labelField:c,valueField:y}=e;return P=>({[c]:String(P),[y]:P})}return t===!1?!1:c=>Object.assign(t(c),{value:c})});function x(t){const c=e.remote,{value:y}=te,{value:P}=O,{value:F}=d,z=[];return t.forEach(B=>{if(P.has(B))z.push(P.get(B));else if(c&&y.has(B))z.push(y.get(B));else if(F){const J=F(B);J&&z.push(J)}}),z}const $=A(()=>{if(e.multiple){const{value:t}=m;return Array.isArray(t)?x(t):[]}return null}),L=A(()=>{const{value:t}=m;return!e.multiple&&!Array.isArray(t)?t===null?null:x([t])[0]||null:null}),V=Bn(e,{mergedSize:t=>{var c,y;const{size:P}=e;if(P)return P;const{mergedSize:F}=t||{};if(F!=null&&F.value)return F.value;const z=(y=(c=f==null?void 0:f.value)===null||c===void 0?void 0:c.Select)===null||y===void 0?void 0:y.size;return z||"medium"}}),{mergedSizeRef:G,mergedDisabledRef:H,mergedStatusRef:U}=V;function q(t,c){const{onChange:y,"onUpdate:value":P,onUpdateValue:F}=e,{nTriggerFormChange:z,nTriggerFormInput:B}=V;y&&ce(y,t,c),F&&ce(F,t,c),P&&ce(P,t,c),r.value=t,z(),B()}function ne(t){const{onBlur:c}=e,{nTriggerFormBlur:y}=V;c&&ce(c,t),y()}function ie(){const{onClear:t}=e;t&&ce(t)}function a(t){const{onFocus:c,showOnFocus:y}=e,{nTriggerFormFocus:P}=V;c&&ce(c,t),P(),y&&ve()}function v(t){const{onSearch:c}=e;c&&ce(c,t)}function X(t){const{onScroll:c}=e;c&&ce(c,t)}function de(){var t;const{remote:c,multiple:y}=e;if(c){const{value:P}=te;if(y){const{valueField:F}=e;(t=$.value)===null||t===void 0||t.forEach(z=>{P.set(z[F],z)})}else{const F=L.value;F&&P.set(F[e.valueField],F)}}}function Se(t){const{onUpdateShow:c,"onUpdate:show":y}=e;c&&ce(c,t),y&&ce(y,t),N.value=t}function ve(){H.value||(Se(!0),N.value=!0,e.filterable&&He())}function re(){Se(!1)}function Re(){C.value="",b.value=Z}const be=M(!1);function Pe(){e.filterable&&(be.value=!0)}function Ie(){e.filterable&&(be.value=!1,D.value||Re())}function ke(){H.value||(D.value?e.filterable?He():re():ve())}function me(t){var c,y;!((y=(c=Q.value)===null||c===void 0?void 0:c.selfRef)===null||y===void 0)&&y.contains(t.relatedTarget)||(w.value=!1,ne(t),re())}function we(t){a(t),w.value=!0}function Be(){w.value=!0}function $e(t){var c;!((c=E.value)===null||c===void 0)&&c.$el.contains(t.relatedTarget)||(w.value=!1,ne(t),re())}function _e(){var t;(t=E.value)===null||t===void 0||t.focus(),re()}function Fe(t){var c;D.value&&(!((c=E.value)===null||c===void 0)&&c.$el.contains(_n(t))||re())}function Te(t){if(!Array.isArray(t))return[];if(d.value)return Array.from(t);{const{remote:c}=e,{value:y}=O;if(c){const{value:P}=te;return t.filter(F=>y.has(F)||P.has(F))}else return t.filter(P=>y.has(P))}}function se(t){s(t.rawNode)}function s(t){if(H.value)return;const{tag:c,remote:y,clearFilterAfterSelect:P,valueField:F}=e;if(c&&!y){const{value:z}=b,B=z[0]||null;if(B){const J=S.value;J.length?J.push(B):S.value=[B],b.value=Z}}if(y&&te.value.set(t[F],t),e.multiple){const z=Te(m.value),B=z.findIndex(J=>J===t[F]);if(~B){if(z.splice(B,1),c&&!y){const J=g(t[F]);~J&&(S.value.splice(J,1),P&&(C.value=""))}}else z.push(t[F]),P&&(C.value="");q(z,x(z))}else{if(c&&!y){const z=g(t[F]);~z?S.value=[S.value[z]]:S.value=Z}De(),re(),q(t[F],t)}}function g(t){return S.value.findIndex(y=>y[e.valueField]===t)}function Y(t){D.value||ve();const{value:c}=t.target;C.value=c;const{tag:y,remote:P}=e;if(v(c),y&&!P){if(!c){b.value=Z;return}const{onCreate:F}=e,z=F?F(c):{[e.labelField]:c,[e.valueField]:c},{valueField:B,labelField:J}=e;I.value.some(ue=>ue[B]===z[B]||ue[J]===z[J])||S.value.some(ue=>ue[B]===z[B]||ue[J]===z[J])?b.value=Z:b.value=[z]}}function Xe(t){t.stopPropagation();const{multiple:c,tag:y,remote:P,clearCreatedOptionsOnClear:F}=e;!c&&e.filterable&&re(),y&&!P&&F&&(S.value=Z),ie(),c?q([],[]):q(null,null)}function Ye(t){!Ee(t,"action")&&!Ee(t,"empty")&&!Ee(t,"header")&&t.preventDefault()}function Qe(t){X(t)}function We(t){var c,y,P,F,z;if(!e.keyboard){t.preventDefault();return}switch(t.key){case" ":if(e.filterable)break;t.preventDefault();case"Enter":if(!(!((c=E.value)===null||c===void 0)&&c.isComposing)){if(D.value){const B=(y=Q.value)===null||y===void 0?void 0:y.getPendingTmNode();B?se(B):e.filterable||(re(),De())}else if(ve(),e.tag&&be.value){const B=b.value[0];if(B){const J=B[e.valueField],{value:ue}=m;e.multiple&&Array.isArray(ue)&&ue.includes(J)||s(B)}}}t.preventDefault();break;case"ArrowUp":if(t.preventDefault(),e.loading)return;D.value&&((P=Q.value)===null||P===void 0||P.prev());break;case"ArrowDown":if(t.preventDefault(),e.loading)return;D.value?(F=Q.value)===null||F===void 0||F.next():ve();break;case"Escape":D.value&&(An(t),re()),(z=E.value)===null||z===void 0||z.focus();break}}function De(){var t;(t=E.value)===null||t===void 0||t.focus()}function He(){var t;(t=E.value)===null||t===void 0||t.focusInput()}function Je(){var t;D.value&&((t=K.value)===null||t===void 0||t.syncPosition())}de(),Ce(ee(e,"options"),de);const Ze={focus:()=>{var t;(t=E.value)===null||t===void 0||t.focus()},focusInput:()=>{var t;(t=E.value)===null||t===void 0||t.focusInput()},blur:()=>{var t;(t=E.value)===null||t===void 0||t.blur()},blurInput:()=>{var t;(t=E.value)===null||t===void 0||t.blurInput()}},Ve=A(()=>{const{self:{menuBoxShadow:t}}=h.value;return{"--n-menu-box-shadow":t}}),pe=i?gt("select",void 0,Ve,e):void 0;return Object.assign(Object.assign({},Ze),{mergedStatus:U,mergedClsPrefix:n,mergedBordered:o,namespace:l,treeMate:R,isMounted:$n(),triggerRef:E,menuRef:Q,pattern:C,uncontrolledShow:N,mergedShow:D,adjustedTo:st(e),uncontrolledValue:r,mergedValue:m,followerRef:K,localizedPlaceholder:le,selectedOption:L,selectedOptions:$,mergedSize:G,mergedDisabled:H,focused:w,activeWithoutMenuOpen:be,inlineThemeDisabled:i,onTriggerInputFocus:Pe,onTriggerInputBlur:Ie,handleTriggerOrMenuResize:Je,handleMenuFocus:Be,handleMenuBlur:$e,handleMenuTabOut:_e,handleTriggerClick:ke,handleToggle:se,handleDeleteOption:s,handlePatternInput:Y,handleClear:Xe,handleTriggerBlur:me,handleTriggerFocus:we,handleKeydown:We,handleMenuAfterLeave:Re,handleMenuClickOutside:Fe,handleMenuScroll:Qe,handleMenuKeydown:We,handleMenuMousedown:Ye,mergedTheme:h,cssVars:i?void 0:Ve,themeClass:pe==null?void 0:pe.themeClass,onRender:pe==null?void 0:pe.onRender})},render(){return u("div",{class:`${this.mergedClsPrefix}-select`},u(zn,null,{default:()=>[u(Mn,null,{default:()=>u(lo,{ref:"triggerRef",inlineThemeDisabled:this.inlineThemeDisabled,status:this.mergedStatus,inputProps:this.inputProps,clsPrefix:this.mergedClsPrefix,showArrow:this.showArrow,maxTagCount:this.maxTagCount,ellipsisTagPopoverProps:this.ellipsisTagPopoverProps,bordered:this.mergedBordered,active:this.activeWithoutMenuOpen||this.mergedShow,pattern:this.pattern,placeholder:this.localizedPlaceholder,selectedOption:this.selectedOption,selectedOptions:this.selectedOptions,multiple:this.multiple,renderTag:this.renderTag,renderLabel:this.renderLabel,filterable:this.filterable,clearable:this.clearable,disabled:this.mergedDisabled,size:this.mergedSize,theme:this.mergedTheme.peers.InternalSelection,labelField:this.labelField,valueField:this.valueField,themeOverrides:this.mergedTheme.peerOverrides.InternalSelection,loading:this.loading,focused:this.focused,onClick:this.handleTriggerClick,onDeleteOption:this.handleDeleteOption,onPatternInput:this.handlePatternInput,onClear:this.handleClear,onBlur:this.handleTriggerBlur,onFocus:this.handleTriggerFocus,onKeydown:this.handleKeydown,onPatternBlur:this.onTriggerInputBlur,onPatternFocus:this.onTriggerInputFocus,onResize:this.handleTriggerOrMenuResize,ignoreComposition:this.ignoreComposition},{arrow:()=>{var e,n;return[(n=(e=this.$slots).arrow)===null||n===void 0?void 0:n.call(e)]}})}),u(Pn,{ref:"followerRef",show:this.mergedShow,to:this.adjustedTo,teleportDisabled:this.adjustedTo===st.tdkey,containerClass:this.namespace,width:this.consistentMenuWidth?"target":void 0,minWidth:"target",placement:this.placement},{default:()=>u(Pt,{name:"fade-in-scale-up-transition",appear:this.isMounted,onAfterLeave:this.handleMenuAfterLeave},{default:()=>{var e,n,o;return this.mergedShow||this.displayDirective==="show"?((e=this.onRender)===null||e===void 0||e.call(this),In(u(eo,Object.assign({},this.menuProps,{ref:"menuRef",onResize:this.handleTriggerOrMenuResize,inlineThemeDisabled:this.inlineThemeDisabled,virtualScroll:this.consistentMenuWidth&&this.virtualScroll,class:[`${this.mergedClsPrefix}-select-menu`,this.themeClass,(n=this.menuProps)===null||n===void 0?void 0:n.class],clsPrefix:this.mergedClsPrefix,focusable:!0,labelField:this.labelField,valueField:this.valueField,autoPending:!0,nodeProps:this.nodeProps,theme:this.mergedTheme.peers.InternalSelectMenu,themeOverrides:this.mergedTheme.peerOverrides.InternalSelectMenu,treeMate:this.treeMate,multiple:this.multiple,size:this.menuSize,renderOption:this.renderOption,renderLabel:this.renderLabel,value:this.mergedValue,style:[(o=this.menuProps)===null||o===void 0?void 0:o.style,this.cssVars],onToggle:this.handleToggle,onScroll:this.handleMenuScroll,onFocus:this.handleMenuFocus,onBlur:this.handleMenuBlur,onKeydown:this.handleMenuKeydown,onTabOut:this.handleMenuTabOut,onMousedown:this.handleMenuMousedown,show:this.mergedShow,showCheckmark:this.showCheckmark,resetMenuOnOptionsChange:this.resetMenuOnOptionsChange,scrollbarProps:this.scrollbarProps}),{empty:()=>{var l,i;return[(i=(l=this.$slots).empty)===null||i===void 0?void 0:i.call(l)]},header:()=>{var l,i;return[(i=(l=this.$slots).header)===null||i===void 0?void 0:i.call(l)]},action:()=>{var l,i;return[(i=(l=this.$slots).action)===null||i===void 0?void 0:i.call(l)]}}),this.displayDirective==="show"?[[kn,this.mergedShow],[mt,this.handleMenuClickOutside,void 0,{capture:!0}]]:[[mt,this.handleMenuClickOutside,void 0,{capture:!0}]])):null}})})]}))}});export{Xn as F,po as N,Un as V,eo as a,io as c,At as i,ot as m,uo as s};
