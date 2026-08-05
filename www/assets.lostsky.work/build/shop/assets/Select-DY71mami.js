import{aN as xe,i as $,p as T,aU as lt,d as he,aI as st,J as u,b9 as ht,a$ as rn,co as Rt,ap as Ne,cp as an,aZ as sn,aH as it,cq as Ft,bj as dn,cr as Ue,aP as Q,S as $e,as as dt,ay as un,cs as Ze,w as Ce,at as Ot,c5 as Te,ct as ut,af as cn,T as Tt,G as _,aJ as V,I as ie,E as fe,aK as rt,bf as Mt,aQ as vt,N as fn,b4 as hn,ba as vn,K as ct,aR as It,L as Me,M as ft,b8 as Ae,cu as gn,cv as bn,U as ye,bT as Ee,cw as pn,cx as mn,F as wn,aV as yn,O as xn,cy as Cn,bs as Sn,bt as Rn,bu as Fn,by as at,au as On,av as Tn,bw as gt,aM as bt,aL as Mn,bA as In,bv as zn,bB as Pn,V as kn,aO as ce,cz as Bn,bk as _n}from"./index-z4gED4Ng.js";import{a as $n}from"./Input-DS75s4UV.js";import{N as et}from"./Tag-DalS3HPr.js";import{N as An}from"./Empty-CQ_gd8at.js";import{u as En}from"./use-locale-Bkn3T_zn.js";function pt(e){return e&-e}class zt{constructor(n,o){this.l=n,this.min=o;const l=new Array(n+1);for(let a=0;a<n+1;++a)l[a]=0;this.ft=l}add(n,o){if(o===0)return;const{l,ft:a}=this;for(n+=1;n<=l;)a[n]+=o,n+=pt(n)}get(n){return this.sum(n+1)-this.sum(n)}sum(n){if(n===void 0&&(n=this.l),n<=0)return 0;const{ft:o,min:l,l:a}=this;if(n>a)throw new Error("[FinweckTree.sum]: `i` is larger than length.");let f=n*l;for(;n>0;)f+=o[n],n-=pt(n);return f}getBound(n){let o=0,l=this.l;for(;l>o;){const a=Math.floor((o+l)/2),f=this.sum(a);if(f>n){l=a;continue}else if(f<n){if(o===a)return this.sum(o+1)<=n?o+1:a;o=a}else return a}return o}}let Ke;function Nn(){return typeof document>"u"?!1:(Ke===void 0&&("matchMedia"in window?Ke=window.matchMedia("(pointer:coarse)").matches:Ke=!1),Ke)}let tt;function mt(){return typeof document>"u"?1:(tt===void 0&&(tt="chrome"in window?window.devicePixelRatio:1),tt)}const Pt="VVirtualListXScroll";function Ln({columnsRef:e,renderColRef:n,renderItemWithColsRef:o}){const l=T(0),a=T(0),f=$(()=>{const p=e.value;if(p.length===0)return null;const x=new zt(p.length,0);return p.forEach((C,k)=>{x.add(k,C.width)}),x}),v=xe(()=>{const p=f.value;return p!==null?Math.max(p.getBound(a.value)-1,0):0}),s=p=>{const x=f.value;return x!==null?x.sum(p):0},y=xe(()=>{const p=f.value;return p!==null?Math.min(p.getBound(a.value+l.value)+1,e.value.length-1):0});return lt(Pt,{startIndexRef:v,endIndexRef:y,columnsRef:e,renderColRef:n,renderItemWithColsRef:o,getLeft:s}),{listWidthRef:l,scrollLeftRef:a}}const wt=he({name:"VirtualListRow",props:{index:{type:Number,required:!0},item:{type:Object,required:!0}},setup(){const{startIndexRef:e,endIndexRef:n,columnsRef:o,getLeft:l,renderColRef:a,renderItemWithColsRef:f}=st(Pt);return{startIndex:e,endIndex:n,columns:o,renderCol:a,renderItemWithCols:f,getLeft:l}},render(){const{startIndex:e,endIndex:n,columns:o,renderCol:l,renderItemWithCols:a,getLeft:f,item:v}=this;if(a!=null)return a({itemIndex:this.index,startColIndex:e,endColIndex:n,allColumns:o,item:v,getLeft:f});if(l!=null){const s=[];for(let y=e;y<=n;++y){const p=o[y];s.push(l({column:p,left:f(y),item:v}))}return s}return null}}),Wn=Ue(".v-vl",{maxHeight:"inherit",height:"100%",overflow:"auto",minWidth:"1px"},[Ue("&:not(.v-vl--show-scrollbar)",{scrollbarWidth:"none"},[Ue("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb",{width:0,height:0,display:"none"})])]),Dn=he({name:"VirtualList",inheritAttrs:!1,props:{showScrollbar:{type:Boolean,default:!0},columns:{type:Array,default:()=>[]},renderCol:Function,renderItemWithCols:Function,items:{type:Array,default:()=>[]},itemSize:{type:Number,required:!0},itemResizable:Boolean,itemsStyle:[String,Object],visibleItemsTag:{type:[String,Object],default:"div"},visibleItemsProps:Object,ignoreItemResize:Boolean,onScroll:Function,onWheel:Function,onResize:Function,defaultScrollKey:[Number,String],defaultScrollIndex:Number,keyField:{type:String,default:"key"},paddingTop:{type:[Number,String],default:0},paddingBottom:{type:[Number,String],default:0}},setup(e){const n=Ft();Wn.mount({id:"vueuc/virtual-list",head:!0,anchorMetaName:Rt,ssr:n}),Ne(()=>{const{defaultScrollIndex:d,defaultScrollKey:m}=e;d!=null?H({index:d}):m!=null&&H({key:m})});let o=!1,l=!1;an(()=>{if(o=!1,!l){l=!0;return}H({top:R.value,left:v.value})}),sn(()=>{o=!0,l||(l=!0)});const a=xe(()=>{if(e.renderCol==null&&e.renderItemWithCols==null||e.columns.length===0)return;let d=0;return e.columns.forEach(m=>{d+=m.width}),d}),f=$(()=>{const d=new Map,{keyField:m}=e;return e.items.forEach((B,E)=>{d.set(B[m],E)}),d}),{scrollLeftRef:v,listWidthRef:s}=Ln({columnsRef:Q(e,"columns"),renderColRef:Q(e,"renderCol"),renderItemWithColsRef:Q(e,"renderItemWithCols")}),y=T(null),p=T(void 0),x=new Map,C=$(()=>{const{items:d,itemSize:m,keyField:B}=e,E=new zt(d.length,m);return d.forEach((W,q)=>{const L=W[B],K=x.get(L);K!==void 0&&E.add(q,K)}),E}),k=T(0),R=T(0),b=xe(()=>Math.max(C.value.getBound(R.value-it(e.paddingTop))-1,0)),A=$(()=>{const{value:d}=p;if(d===void 0)return[];const{items:m,itemSize:B}=e,E=b.value,W=Math.min(E+Math.ceil(d/B+1),m.length-1),q=[];for(let L=E;L<=W;++L)q.push(m[L]);return q}),H=(d,m)=>{if(typeof d=="number"){j(d,m,"auto");return}const{left:B,top:E,index:W,key:q,position:L,behavior:K,debounce:U=!0}=d;if(B!==void 0||E!==void 0)j(B,E,K);else if(W!==void 0)z(W,K,U);else if(q!==void 0){const te=f.value.get(q);te!==void 0&&z(te,K,U)}else L==="bottom"?j(0,Number.MAX_SAFE_INTEGER,K):L==="top"&&j(0,0,K)};let I,F=null;function z(d,m,B){const{value:E}=C,W=E.sum(d)+it(e.paddingTop);if(!B)y.value.scrollTo({left:0,top:W,behavior:m});else{I=d,F!==null&&window.clearTimeout(F),F=window.setTimeout(()=>{I=void 0,F=null},16);const{scrollTop:q,offsetHeight:L}=y.value;if(W>q){const K=E.get(d);W+K<=q+L||y.value.scrollTo({left:0,top:W+K-L,behavior:m})}else y.value.scrollTo({left:0,top:W,behavior:m})}}function j(d,m,B){y.value.scrollTo({left:d,top:m,behavior:B})}function D(d,m){var B,E,W;if(o||e.ignoreItemResize||ne(m.target))return;const{value:q}=C,L=f.value.get(d),K=q.get(L),U=(W=(E=(B=m.borderBoxSize)===null||B===void 0?void 0:B[0])===null||E===void 0?void 0:E.blockSize)!==null&&W!==void 0?W:m.contentRect.height;if(U===K)return;U-e.itemSize===0?x.delete(d):x.set(d,U-e.itemSize);const oe=U-K;if(oe===0)return;q.add(L,oe);const i=y.value;if(i!=null){if(I===void 0){const h=q.sum(L);i.scrollTop>h&&i.scrollBy(0,oe)}else if(L<I)i.scrollBy(0,oe);else if(L===I){const h=q.sum(L);U+h>i.scrollTop+i.offsetHeight&&i.scrollBy(0,oe)}ee()}k.value++}const N=!Nn();let X=!1;function Z(d){var m;(m=e.onScroll)===null||m===void 0||m.call(e,d),(!N||!X)&&ee()}function re(d){var m;if((m=e.onWheel)===null||m===void 0||m.call(e,d),N){const B=y.value;if(B!=null){if(d.deltaX===0&&(B.scrollTop===0&&d.deltaY<=0||B.scrollTop+B.offsetHeight>=B.scrollHeight&&d.deltaY>=0))return;d.preventDefault(),B.scrollTop+=d.deltaY/mt(),B.scrollLeft+=d.deltaX/mt(),ee(),X=!0,dn(()=>{X=!1})}}}function ae(d){if(o||ne(d.target))return;if(e.renderCol==null&&e.renderItemWithCols==null){if(d.contentRect.height===p.value)return}else if(d.contentRect.height===p.value&&d.contentRect.width===s.value)return;p.value=d.contentRect.height,s.value=d.contentRect.width;const{onResize:m}=e;m!==void 0&&m(d)}function ee(){const{value:d}=y;d!=null&&(R.value=d.scrollTop,v.value=d.scrollLeft)}function ne(d){let m=d;for(;m!==null;){if(m.style.display==="none")return!0;m=m.parentElement}return!1}return{listHeight:p,listStyle:{overflow:"auto"},keyToIndex:f,itemsStyle:$(()=>{const{itemResizable:d}=e,m=$e(C.value.sum());return k.value,[e.itemsStyle,{boxSizing:"content-box",width:$e(a.value),height:d?"":m,minHeight:d?m:"",paddingTop:$e(e.paddingTop),paddingBottom:$e(e.paddingBottom)}]}),visibleItemsStyle:$(()=>(k.value,{transform:`translateY(${$e(C.value.sum(b.value))})`})),viewportItems:A,listElRef:y,itemsElRef:T(null),scrollTo:H,handleListResize:ae,handleListScroll:Z,handleListWheel:re,handleItemResize:D}},render(){const{itemResizable:e,keyField:n,keyToIndex:o,visibleItemsTag:l}=this;return u(ht,{onResize:this.handleListResize},{default:()=>{var a,f;return u("div",rn(this.$attrs,{class:["v-vl",this.showScrollbar&&"v-vl--show-scrollbar"],onScroll:this.handleListScroll,onWheel:this.handleListWheel,ref:"listElRef"}),[this.items.length!==0?u("div",{ref:"itemsElRef",class:"v-vl-items",style:this.itemsStyle},[u(l,Object.assign({class:"v-vl-visible-items",style:this.visibleItemsStyle},this.visibleItemsProps),{default:()=>{const{renderCol:v,renderItemWithCols:s}=this;return this.viewportItems.map(y=>{const p=y[n],x=o.get(p),C=v!=null?u(wt,{index:x,item:y}):void 0,k=s!=null?u(wt,{index:x,item:y}):void 0,R=this.$slots.default({item:y,renderedCols:C,renderedItemWithCols:k,index:x})[0];return e?u(ht,{key:p,onResize:b=>this.handleItemResize(p,b)},{default:()=>R}):(R.key=p,R)})}})]):(f=(a=this.$slots).empty)===null||f===void 0?void 0:f.call(a)])}})}}),ge="v-hidden",Vn=Ue("[v-hidden]",{display:"none!important"}),yt=he({name:"Overflow",props:{getCounter:Function,getTail:Function,updateCounter:Function,onUpdateCount:Function,onUpdateOverflow:Function},setup(e,{slots:n}){const o=T(null),l=T(null);function a(v){const{value:s}=o,{getCounter:y,getTail:p}=e;let x;if(y!==void 0?x=y():x=l.value,!s||!x)return;x.hasAttribute(ge)&&x.removeAttribute(ge);const{children:C}=s;if(v.showAllItemsBeforeCalculate)for(const z of C)z.hasAttribute(ge)&&z.removeAttribute(ge);const k=s.offsetWidth,R=[],b=n.tail?p==null?void 0:p():null;let A=b?b.offsetWidth:0,H=!1;const I=s.children.length-(n.tail?1:0);for(let z=0;z<I-1;++z){if(z<0)continue;const j=C[z];if(H){j.hasAttribute(ge)||j.setAttribute(ge,"");continue}else j.hasAttribute(ge)&&j.removeAttribute(ge);const D=j.offsetWidth;if(A+=D,R[z]=D,A>k){const{updateCounter:N}=e;for(let X=z;X>=0;--X){const Z=I-1-X;N!==void 0?N(Z):x.textContent=`${Z}`;const re=x.offsetWidth;if(A-=R[X],A+re<=k||X===0){H=!0,z=X-1,b&&(z===-1?(b.style.maxWidth=`${k-re}px`,b.style.boxSizing="border-box"):b.style.maxWidth="");const{onUpdateCount:ae}=e;ae&&ae(Z);break}}}}const{onUpdateOverflow:F}=e;H?F!==void 0&&F(!0):(F!==void 0&&F(!1),x.setAttribute(ge,""))}const f=Ft();return Vn.mount({id:"vueuc/overflow",head:!0,anchorMetaName:Rt,ssr:f}),Ne(()=>a({showAllItemsBeforeCalculate:!1})),{selfRef:o,counterRef:l,sync:a}},render(){const{$slots:e}=this;return dt(()=>this.sync({showAllItemsBeforeCalculate:!1})),u("div",{class:"v-overflow",ref:"selfRef"},[un(e,"default"),e.counter?e.counter():u("span",{style:{display:"inline-block"},ref:"counterRef"}),e.tail?e.tail():null])}});function kt(e,n){n&&(Ne(()=>{const{value:o}=e;o&&Ze.registerHandler(o,n)}),Ce(e,(o,l)=>{l&&Ze.unregisterHandler(l)},{deep:!1}),Ot(()=>{const{value:o}=e;o&&Ze.unregisterHandler(o)}))}function xt(e){switch(typeof e){case"string":return e||void 0;case"number":return String(e);default:return}}function nt(e){const n=e.filter(o=>o!==void 0);if(n.length!==0)return n.length===1?n[0]:o=>{e.forEach(l=>{l&&l(o)})}}const jn=he({name:"Checkmark",render(){return u("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},u("g",{fill:"none"},u("path",{d:"M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",fill:"currentColor"})))}}),Hn=he({props:{onFocus:Function,onBlur:Function},setup(e){return()=>u("div",{style:"width: 0; height: 0",tabindex:0,onFocus:e.onFocus,onBlur:e.onBlur})}}),Ct=he({name:"NBaseSelectGroupHeader",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(){const{renderLabelRef:e,renderOptionRef:n,labelFieldRef:o,nodePropsRef:l}=st(ut);return{labelField:o,nodeProps:l,renderLabel:e,renderOption:n}},render(){const{clsPrefix:e,renderLabel:n,renderOption:o,nodeProps:l,tmNode:{rawNode:a}}=this,f=l==null?void 0:l(a),v=n?n(a,!1):Te(a[this.labelField],a,!1),s=u("div",Object.assign({},f,{class:[`${e}-base-select-group-header`,f==null?void 0:f.class]}),v);return a.render?a.render({node:s,option:a}):o?o({node:s,option:a,selected:!1}):s}});function Kn(e,n){return u(Tt,{name:"fade-in-scale-up-transition"},{default:()=>e?u(cn,{clsPrefix:n,class:`${n}-base-select-option__check`},{default:()=>u(jn)}):null})}const St=he({name:"NBaseSelectOption",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(e){const{valueRef:n,pendingTmNodeRef:o,multipleRef:l,valueSetRef:a,renderLabelRef:f,renderOptionRef:v,labelFieldRef:s,valueFieldRef:y,showCheckmarkRef:p,nodePropsRef:x,handleOptionClick:C,handleOptionMouseEnter:k}=st(ut),R=xe(()=>{const{value:I}=o;return I?e.tmNode.key===I.key:!1});function b(I){const{tmNode:F}=e;F.disabled||C(I,F)}function A(I){const{tmNode:F}=e;F.disabled||k(I,F)}function H(I){const{tmNode:F}=e,{value:z}=R;F.disabled||z||k(I,F)}return{multiple:l,isGrouped:xe(()=>{const{tmNode:I}=e,{parent:F}=I;return F&&F.rawNode.type==="group"}),showCheckmark:p,nodeProps:x,isPending:R,isSelected:xe(()=>{const{value:I}=n,{value:F}=l;if(I===null)return!1;const z=e.tmNode.rawNode[y.value];if(F){const{value:j}=a;return j.has(z)}else return I===z}),labelField:s,renderLabel:f,renderOption:v,handleMouseMove:H,handleMouseEnter:A,handleClick:b}},render(){const{clsPrefix:e,tmNode:{rawNode:n},isSelected:o,isPending:l,isGrouped:a,showCheckmark:f,nodeProps:v,renderOption:s,renderLabel:y,handleClick:p,handleMouseEnter:x,handleMouseMove:C}=this,k=Kn(o,e),R=y?[y(n,o),f&&k]:[Te(n[this.labelField],n,o),f&&k],b=v==null?void 0:v(n),A=u("div",Object.assign({},b,{class:[`${e}-base-select-option`,n.class,b==null?void 0:b.class,{[`${e}-base-select-option--disabled`]:n.disabled,[`${e}-base-select-option--selected`]:o,[`${e}-base-select-option--grouped`]:a,[`${e}-base-select-option--pending`]:l,[`${e}-base-select-option--show-checkmark`]:f}],style:[(b==null?void 0:b.style)||"",n.style||""],onClick:nt([p,b==null?void 0:b.onClick]),onMouseenter:nt([x,b==null?void 0:b.onMouseenter]),onMousemove:nt([C,b==null?void 0:b.onMousemove])}),u("div",{class:`${e}-base-select-option__content`},R));return n.render?n.render({node:A,option:n,selected:o}):s?s({node:A,option:n,selected:o}):A}}),Un=_("base-select-menu",`
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
 `,[V("content",`
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
 `),V("loading, empty",`
 display: flex;
 padding: 12px 32px;
 flex: 1;
 justify-content: center;
 `),V("loading",`
 color: var(--n-loading-color);
 font-size: var(--n-loading-size);
 `),V("header",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-bottom: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),V("action",`
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
 `,[ie("show-checkmark",`
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
 `),ie("grouped",`
 padding-left: calc(var(--n-option-padding-left) * 1.5);
 `),ie("pending",[fe("&::before",`
 background-color: var(--n-option-color-pending);
 `)]),ie("selected",`
 color: var(--n-option-text-color-active);
 `,[fe("&::before",`
 background-color: var(--n-option-color-active);
 `),ie("pending",[fe("&::before",`
 background-color: var(--n-option-color-active-pending);
 `)])]),ie("disabled",`
 cursor: not-allowed;
 `,[rt("selected",`
 color: var(--n-option-text-color-disabled);
 `),ie("selected",`
 opacity: var(--n-option-opacity-disabled);
 `)]),V("check",`
 font-size: 16px;
 position: absolute;
 right: calc(var(--n-option-padding-right) - 4px);
 top: calc(50% - 7px);
 color: var(--n-option-check-color);
 transition: color .3s var(--n-bezier);
 `,[Mt({enterScale:"0.5"})])])]),qn=he({name:"InternalSelectMenu",props:Object.assign(Object.assign({},Me.props),{clsPrefix:{type:String,required:!0},scrollable:{type:Boolean,default:!0},treeMate:{type:Object,required:!0},multiple:Boolean,size:{type:String,default:"medium"},value:{type:[String,Number,Array],default:null},autoPending:Boolean,virtualScroll:{type:Boolean,default:!0},show:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},loading:Boolean,focusable:Boolean,renderLabel:Function,renderOption:Function,nodeProps:Function,showCheckmark:{type:Boolean,default:!0},onMousedown:Function,onScroll:Function,onFocus:Function,onBlur:Function,onKeyup:Function,onKeydown:Function,onTabOut:Function,onMouseenter:Function,onMouseleave:Function,onResize:Function,resetMenuOnOptionsChange:{type:Boolean,default:!0},inlineThemeDisabled:Boolean,scrollbarProps:Object,onToggle:Function}),setup(e){const{mergedClsPrefixRef:n,mergedRtlRef:o,mergedComponentPropsRef:l}=ct(e),a=It("InternalSelectMenu",o,n),f=Me("InternalSelectMenu","-internal-select-menu",Un,gn,e,Q(e,"clsPrefix")),v=T(null),s=T(null),y=T(null),p=$(()=>e.treeMate.getFlattenedNodes()),x=$(()=>bn(p.value)),C=T(null);function k(){const{treeMate:i}=e;let h=null;const{value:G}=e;G===null?h=i.getFirstAvailableNode():(e.multiple?h=i.getNode((G||[])[(G||[]).length-1]):h=i.getNode(G),(!h||h.disabled)&&(h=i.getFirstAvailableNode())),E(h||null)}function R(){const{value:i}=C;i&&!e.treeMate.getNode(i.key)&&(C.value=null)}let b;Ce(()=>e.show,i=>{i?b=Ce(()=>e.treeMate,()=>{e.resetMenuOnOptionsChange?(e.autoPending?k():R(),dt(W)):R()},{immediate:!0}):b==null||b()},{immediate:!0}),Ot(()=>{b==null||b()});const A=$(()=>it(f.value.self[ye("optionHeight",e.size)])),H=$(()=>Ee(f.value.self[ye("padding",e.size)])),I=$(()=>e.multiple&&Array.isArray(e.value)?new Set(e.value):new Set),F=$(()=>{const i=p.value;return i&&i.length===0}),z=$(()=>{var i,h;return(h=(i=l==null?void 0:l.value)===null||i===void 0?void 0:i.Select)===null||h===void 0?void 0:h.renderEmpty});function j(i){const{onToggle:h}=e;h&&h(i)}function D(i){const{onScroll:h}=e;h&&h(i)}function N(i){var h;(h=y.value)===null||h===void 0||h.sync(),D(i)}function X(){var i;(i=y.value)===null||i===void 0||i.sync()}function Z(){const{value:i}=C;return i||null}function re(i,h){h.disabled||E(h,!1)}function ae(i,h){h.disabled||j(h)}function ee(i){var h;Ae(i,"action")||(h=e.onKeyup)===null||h===void 0||h.call(e,i)}function ne(i){var h;Ae(i,"action")||(h=e.onKeydown)===null||h===void 0||h.call(e,i)}function d(i){var h;(h=e.onMousedown)===null||h===void 0||h.call(e,i),!e.focusable&&i.preventDefault()}function m(){const{value:i}=C;i&&E(i.getNext({loop:!0}),!0)}function B(){const{value:i}=C;i&&E(i.getPrev({loop:!0}),!0)}function E(i,h=!1){C.value=i,h&&W()}function W(){var i,h;const G=C.value;if(!G)return;const de=x.value(G.key);de!==null&&(e.virtualScroll?(i=s.value)===null||i===void 0||i.scrollTo({index:de}):(h=y.value)===null||h===void 0||h.scrollTo({index:de,elSize:A.value}))}function q(i){var h,G;!((h=v.value)===null||h===void 0)&&h.contains(i.target)&&((G=e.onFocus)===null||G===void 0||G.call(e,i))}function L(i){var h,G;!((h=v.value)===null||h===void 0)&&h.contains(i.relatedTarget)||(G=e.onBlur)===null||G===void 0||G.call(e,i)}lt(ut,{handleOptionMouseEnter:re,handleOptionClick:ae,valueSetRef:I,pendingTmNodeRef:C,nodePropsRef:Q(e,"nodeProps"),showCheckmarkRef:Q(e,"showCheckmark"),multipleRef:Q(e,"multiple"),valueRef:Q(e,"value"),renderLabelRef:Q(e,"renderLabel"),renderOptionRef:Q(e,"renderOption"),labelFieldRef:Q(e,"labelField"),valueFieldRef:Q(e,"valueField")}),lt(pn,v),Ne(()=>{const{value:i}=y;i&&i.sync()});const K=$(()=>{const{size:i}=e,{common:{cubicBezierEaseInOut:h},self:{height:G,borderRadius:de,color:Se,groupHeaderTextColor:ve,actionDividerColor:le,optionTextColorPressed:Re,optionTextColor:be,optionTextColorDisabled:Ie,optionTextColorActive:ze,optionOpacityDisabled:Pe,optionCheckColor:me,actionTextColor:we,optionColorPending:ke,optionColorActive:Be,loadingColor:_e,loadingSize:Fe,optionColorActivePending:Oe,[ye("optionFontSize",i)]:se,[ye("optionHeight",i)]:r,[ye("optionPadding",i)]:g}}=f.value;return{"--n-height":G,"--n-action-divider-color":le,"--n-action-text-color":we,"--n-bezier":h,"--n-border-radius":de,"--n-color":Se,"--n-option-font-size":se,"--n-group-header-text-color":ve,"--n-option-check-color":me,"--n-option-color-pending":ke,"--n-option-color-active":Be,"--n-option-color-active-pending":Oe,"--n-option-height":r,"--n-option-opacity-disabled":Pe,"--n-option-text-color":be,"--n-option-text-color-active":ze,"--n-option-text-color-disabled":Ie,"--n-option-text-color-pressed":Re,"--n-option-padding":g,"--n-option-padding-left":Ee(g,"left"),"--n-option-padding-right":Ee(g,"right"),"--n-loading-color":_e,"--n-loading-size":Fe}}),{inlineThemeDisabled:U}=e,te=U?ft("internal-select-menu",$(()=>e.size[0]),K,e):void 0,oe={selfRef:v,next:m,prev:B,getPendingTmNode:Z};return kt(v,e.onResize),Object.assign({mergedTheme:f,mergedClsPrefix:n,rtlEnabled:a,virtualListRef:s,scrollbarRef:y,itemSize:A,padding:H,flattenedNodes:p,empty:F,mergedRenderEmpty:z,virtualListContainer(){const{value:i}=s;return i==null?void 0:i.listElRef},virtualListContent(){const{value:i}=s;return i==null?void 0:i.itemsElRef},doScroll:D,handleFocusin:q,handleFocusout:L,handleKeyUp:ee,handleKeyDown:ne,handleMouseDown:d,handleVirtualListResize:X,handleVirtualListScroll:N,cssVars:U?void 0:K,themeClass:te==null?void 0:te.themeClass,onRender:te==null?void 0:te.onRender},oe)},render(){const{$slots:e,virtualScroll:n,clsPrefix:o,mergedTheme:l,themeClass:a,onRender:f}=this;return f==null||f(),u("div",{ref:"selfRef",tabindex:this.focusable?0:-1,class:[`${o}-base-select-menu`,`${o}-base-select-menu--${this.size}-size`,this.rtlEnabled&&`${o}-base-select-menu--rtl`,a,this.multiple&&`${o}-base-select-menu--multiple`],style:this.cssVars,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onKeyup:this.handleKeyUp,onKeydown:this.handleKeyDown,onMousedown:this.handleMouseDown,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},vt(e.header,v=>v&&u("div",{class:`${o}-base-select-menu__header`,"data-header":!0,key:"header"},v)),this.loading?u("div",{class:`${o}-base-select-menu__loading`},u(fn,{clsPrefix:o,strokeWidth:20})):this.empty?u("div",{class:`${o}-base-select-menu__empty`,"data-empty":!0},vn(e.empty,()=>{var v;return[((v=this.mergedRenderEmpty)===null||v===void 0?void 0:v.call(this))||u(An,{theme:l.peers.Empty,themeOverrides:l.peerOverrides.Empty,size:this.size})]})):u(hn,Object.assign({ref:"scrollbarRef",theme:l.peers.Scrollbar,themeOverrides:l.peerOverrides.Scrollbar,scrollable:this.scrollable,container:n?this.virtualListContainer:void 0,content:n?this.virtualListContent:void 0,onScroll:n?void 0:this.doScroll},this.scrollbarProps),{default:()=>n?u(Dn,{ref:"virtualListRef",class:`${o}-virtual-list`,items:this.flattenedNodes,itemSize:this.itemSize,showScrollbar:!1,paddingTop:this.padding.top,paddingBottom:this.padding.bottom,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemResizable:!0},{default:({item:v})=>v.isGroup?u(Ct,{key:v.key,clsPrefix:o,tmNode:v}):v.ignored?null:u(St,{clsPrefix:o,key:v.key,tmNode:v})}):u("div",{class:`${o}-base-select-menu-option-wrapper`,style:{paddingTop:this.padding.top,paddingBottom:this.padding.bottom}},this.flattenedNodes.map(v=>v.isGroup?u(Ct,{key:v.key,clsPrefix:o,tmNode:v}):u(St,{clsPrefix:o,key:v.key,tmNode:v})))}),vt(e.action,v=>v&&[u("div",{class:`${o}-base-select-menu__action`,"data-action":!0,key:"action"},v),u(Hn,{onFocus:this.onTabOut,key:"focus-detector"})]))}}),Gn=fe([_("base-selection",`
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
 `),_("base-selection-tags","min-height: var(--n-height);"),V("border, state-border",`
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
 `),V("state-border",`
 z-index: 1;
 border-color: #0000;
 `),_("base-suffix",`
 cursor: pointer;
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 right: 10px;
 `,[V("arrow",`
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
 `,[V("wrapper",`
 flex-basis: 0;
 flex-grow: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 `)]),_("base-selection-placeholder",`
 color: var(--n-placeholder-color);
 `,[V("inner",`
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
 `,[V("content",`
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap; 
 `)]),V("render-label",`
 color: var(--n-text-color);
 `)]),rt("disabled",[fe("&:hover",[V("state-border",`
 box-shadow: var(--n-box-shadow-hover);
 border: var(--n-border-hover);
 `)]),ie("focus",[V("state-border",`
 box-shadow: var(--n-box-shadow-focus);
 border: var(--n-border-focus);
 `)]),ie("active",[V("state-border",`
 box-shadow: var(--n-box-shadow-active);
 border: var(--n-border-active);
 `),_("base-selection-label","background-color: var(--n-color-active);"),_("base-selection-tags","background-color: var(--n-color-active);")])]),ie("disabled","cursor: not-allowed;",[V("arrow",`
 color: var(--n-arrow-color-disabled);
 `),_("base-selection-label",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `,[_("base-selection-input",`
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 `),V("render-label",`
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
 `,[V("input",`
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
 `),V("mirror",`
 position: absolute;
 left: 0;
 top: 0;
 white-space: pre;
 visibility: hidden;
 user-select: none;
 -webkit-user-select: none;
 opacity: 0;
 `)]),["warning","error"].map(e=>ie(`${e}-status`,[V("state-border",`border: var(--n-border-${e});`),rt("disabled",[fe("&:hover",[V("state-border",`
 box-shadow: var(--n-box-shadow-hover-${e});
 border: var(--n-border-hover-${e});
 `)]),ie("active",[V("state-border",`
 box-shadow: var(--n-box-shadow-active-${e});
 border: var(--n-border-active-${e});
 `),_("base-selection-label",`background-color: var(--n-color-active-${e});`),_("base-selection-tags",`background-color: var(--n-color-active-${e});`)]),ie("focus",[V("state-border",`
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
 `,[V("content",`
 line-height: 1.25;
 text-overflow: ellipsis;
 overflow: hidden;
 `)])])]),Xn=he({name:"InternalSelection",props:Object.assign(Object.assign({},Me.props),{clsPrefix:{type:String,required:!0},bordered:{type:Boolean,default:void 0},active:Boolean,pattern:{type:String,default:""},placeholder:String,selectedOption:{type:Object,default:null},selectedOptions:{type:Array,default:null},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},multiple:Boolean,filterable:Boolean,clearable:Boolean,disabled:Boolean,size:{type:String,default:"medium"},loading:Boolean,autofocus:Boolean,showArrow:{type:Boolean,default:!0},inputProps:Object,focused:Boolean,renderTag:Function,onKeydown:Function,onClick:Function,onBlur:Function,onFocus:Function,onDeleteOption:Function,maxTagCount:[String,Number],ellipsisTagPopoverProps:Object,onClear:Function,onPatternInput:Function,onPatternFocus:Function,onPatternBlur:Function,renderLabel:Function,status:String,inlineThemeDisabled:Boolean,ignoreComposition:{type:Boolean,default:!0},onResize:Function}),setup(e){const{mergedClsPrefixRef:n,mergedRtlRef:o}=ct(e),l=It("InternalSelection",o,n),a=T(null),f=T(null),v=T(null),s=T(null),y=T(null),p=T(null),x=T(null),C=T(null),k=T(null),R=T(null),b=T(!1),A=T(!1),H=T(!1),I=Me("InternalSelection","-internal-selection",Gn,Cn,e,Q(e,"clsPrefix")),F=$(()=>e.clearable&&!e.disabled&&(H.value||e.active)),z=$(()=>e.selectedOption?e.renderTag?e.renderTag({option:e.selectedOption,handleClose:()=>{}}):e.renderLabel?e.renderLabel(e.selectedOption,!0):Te(e.selectedOption[e.labelField],e.selectedOption,!0):e.placeholder),j=$(()=>{const r=e.selectedOption;if(r)return r[e.labelField]}),D=$(()=>e.multiple?!!(Array.isArray(e.selectedOptions)&&e.selectedOptions.length):e.selectedOption!==null);function N(){var r;const{value:g}=a;if(g){const{value:Y}=f;Y&&(Y.style.width=`${g.offsetWidth}px`,e.maxTagCount!=="responsive"&&((r=k.value)===null||r===void 0||r.sync({showAllItemsBeforeCalculate:!1})))}}function X(){const{value:r}=R;r&&(r.style.display="none")}function Z(){const{value:r}=R;r&&(r.style.display="inline-block")}Ce(Q(e,"active"),r=>{r||X()}),Ce(Q(e,"pattern"),()=>{e.multiple&&dt(N)});function re(r){const{onFocus:g}=e;g&&g(r)}function ae(r){const{onBlur:g}=e;g&&g(r)}function ee(r){const{onDeleteOption:g}=e;g&&g(r)}function ne(r){const{onClear:g}=e;g&&g(r)}function d(r){const{onPatternInput:g}=e;g&&g(r)}function m(r){var g;(!r.relatedTarget||!(!((g=v.value)===null||g===void 0)&&g.contains(r.relatedTarget)))&&re(r)}function B(r){var g;!((g=v.value)===null||g===void 0)&&g.contains(r.relatedTarget)||ae(r)}function E(r){ne(r)}function W(){H.value=!0}function q(){H.value=!1}function L(r){!e.active||!e.filterable||r.target!==f.value&&r.preventDefault()}function K(r){ee(r)}const U=T(!1);function te(r){if(r.key==="Backspace"&&!U.value&&!e.pattern.length){const{selectedOptions:g}=e;g!=null&&g.length&&K(g[g.length-1])}}let oe=null;function i(r){const{value:g}=a;if(g){const Y=r.target.value;g.textContent=Y,N()}e.ignoreComposition&&U.value?oe=r:d(r)}function h(){U.value=!0}function G(){U.value=!1,e.ignoreComposition&&d(oe),oe=null}function de(r){var g;A.value=!0,(g=e.onPatternFocus)===null||g===void 0||g.call(e,r)}function Se(r){var g;A.value=!1,(g=e.onPatternBlur)===null||g===void 0||g.call(e,r)}function ve(){var r,g;if(e.filterable)A.value=!1,(r=p.value)===null||r===void 0||r.blur(),(g=f.value)===null||g===void 0||g.blur();else if(e.multiple){const{value:Y}=s;Y==null||Y.blur()}else{const{value:Y}=y;Y==null||Y.blur()}}function le(){var r,g,Y;e.filterable?(A.value=!1,(r=p.value)===null||r===void 0||r.focus()):e.multiple?(g=s.value)===null||g===void 0||g.focus():(Y=y.value)===null||Y===void 0||Y.focus()}function Re(){const{value:r}=f;r&&(Z(),r.focus())}function be(){const{value:r}=f;r&&r.blur()}function Ie(r){const{value:g}=x;g&&g.setTextContent(`+${r}`)}function ze(){const{value:r}=C;return r}function Pe(){return f.value}let me=null;function we(){me!==null&&window.clearTimeout(me)}function ke(){e.active||(we(),me=window.setTimeout(()=>{D.value&&(b.value=!0)},100))}function Be(){we()}function _e(r){r||(we(),b.value=!1)}Ce(D,r=>{r||(b.value=!1)}),Ne(()=>{xn(()=>{const r=p.value;r&&(e.disabled?r.removeAttribute("tabindex"):r.tabIndex=A.value?-1:0)})}),kt(v,e.onResize);const{inlineThemeDisabled:Fe}=e,Oe=$(()=>{const{size:r}=e,{common:{cubicBezierEaseInOut:g},self:{fontWeight:Y,borderRadius:Ge,color:Xe,placeholderColor:Ye,textColor:Le,paddingSingle:We,paddingMultiple:De,caretColor:Je,colorDisabled:Qe,textColorDisabled:Ve,placeholderColorDisabled:pe,colorActive:t,boxShadowFocus:c,boxShadowActive:w,boxShadowHover:M,border:S,borderFocus:O,borderHover:P,borderActive:J,arrowColor:ue,arrowColorDisabled:_t,loadingColor:$t,colorActiveWarning:At,boxShadowFocusWarning:Et,boxShadowActiveWarning:Nt,boxShadowHoverWarning:Lt,borderWarning:Wt,borderFocusWarning:Dt,borderHoverWarning:Vt,borderActiveWarning:jt,colorActiveError:Ht,boxShadowFocusError:Kt,boxShadowActiveError:Ut,boxShadowHoverError:qt,borderError:Gt,borderFocusError:Xt,borderHoverError:Yt,borderActiveError:Jt,clearColor:Qt,clearColorHover:Zt,clearColorPressed:en,clearSize:tn,arrowSize:nn,[ye("height",r)]:on,[ye("fontSize",r)]:ln}}=I.value,je=Ee(We),He=Ee(De);return{"--n-bezier":g,"--n-border":S,"--n-border-active":J,"--n-border-focus":O,"--n-border-hover":P,"--n-border-radius":Ge,"--n-box-shadow-active":w,"--n-box-shadow-focus":c,"--n-box-shadow-hover":M,"--n-caret-color":Je,"--n-color":Xe,"--n-color-active":t,"--n-color-disabled":Qe,"--n-font-size":ln,"--n-height":on,"--n-padding-single-top":je.top,"--n-padding-multiple-top":He.top,"--n-padding-single-right":je.right,"--n-padding-multiple-right":He.right,"--n-padding-single-left":je.left,"--n-padding-multiple-left":He.left,"--n-padding-single-bottom":je.bottom,"--n-padding-multiple-bottom":He.bottom,"--n-placeholder-color":Ye,"--n-placeholder-color-disabled":pe,"--n-text-color":Le,"--n-text-color-disabled":Ve,"--n-arrow-color":ue,"--n-arrow-color-disabled":_t,"--n-loading-color":$t,"--n-color-active-warning":At,"--n-box-shadow-focus-warning":Et,"--n-box-shadow-active-warning":Nt,"--n-box-shadow-hover-warning":Lt,"--n-border-warning":Wt,"--n-border-focus-warning":Dt,"--n-border-hover-warning":Vt,"--n-border-active-warning":jt,"--n-color-active-error":Ht,"--n-box-shadow-focus-error":Kt,"--n-box-shadow-active-error":Ut,"--n-box-shadow-hover-error":qt,"--n-border-error":Gt,"--n-border-focus-error":Xt,"--n-border-hover-error":Yt,"--n-border-active-error":Jt,"--n-clear-size":tn,"--n-clear-color":Qt,"--n-clear-color-hover":Zt,"--n-clear-color-pressed":en,"--n-arrow-size":nn,"--n-font-weight":Y}}),se=Fe?ft("internal-selection",$(()=>e.size[0]),Oe,e):void 0;return{mergedTheme:I,mergedClearable:F,mergedClsPrefix:n,rtlEnabled:l,patternInputFocused:A,filterablePlaceholder:z,label:j,selected:D,showTagsPanel:b,isComposing:U,counterRef:x,counterWrapperRef:C,patternInputMirrorRef:a,patternInputRef:f,selfRef:v,multipleElRef:s,singleElRef:y,patternInputWrapperRef:p,overflowRef:k,inputTagElRef:R,handleMouseDown:L,handleFocusin:m,handleClear:E,handleMouseEnter:W,handleMouseLeave:q,handleDeleteOption:K,handlePatternKeyDown:te,handlePatternInputInput:i,handlePatternInputBlur:Se,handlePatternInputFocus:de,handleMouseEnterCounter:ke,handleMouseLeaveCounter:Be,handleFocusout:B,handleCompositionEnd:G,handleCompositionStart:h,onPopoverUpdateShow:_e,focus:le,focusInput:Re,blur:ve,blurInput:be,updateCounter:Ie,getCounter:ze,getTail:Pe,renderLabel:e.renderLabel,cssVars:Fe?void 0:Oe,themeClass:se==null?void 0:se.themeClass,onRender:se==null?void 0:se.onRender}},render(){const{status:e,multiple:n,size:o,disabled:l,filterable:a,maxTagCount:f,bordered:v,clsPrefix:s,ellipsisTagPopoverProps:y,onRender:p,renderTag:x,renderLabel:C}=this;p==null||p();const k=f==="responsive",R=typeof f=="number",b=k||R,A=u(mn,null,{default:()=>u($n,{clsPrefix:s,loading:this.loading,showArrow:this.showArrow,showClear:this.mergedClearable&&this.selected,onClear:this.handleClear},{default:()=>{var I,F;return(F=(I=this.$slots).arrow)===null||F===void 0?void 0:F.call(I)}})});let H;if(n){const{labelField:I}=this,F=d=>u("div",{class:`${s}-base-selection-tag-wrapper`,key:d.value},x?x({option:d,handleClose:()=>{this.handleDeleteOption(d)}}):u(et,{size:o,closable:!d.disabled,disabled:l,onClose:()=>{this.handleDeleteOption(d)},internalCloseIsButtonTag:!1,internalCloseFocusable:!1},{default:()=>C?C(d,!0):Te(d[I],d,!0)})),z=()=>(R?this.selectedOptions.slice(0,f):this.selectedOptions).map(F),j=a?u("div",{class:`${s}-base-selection-input-tag`,ref:"inputTagElRef",key:"__input-tag__"},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",tabindex:-1,disabled:l,value:this.pattern,autofocus:this.autofocus,class:`${s}-base-selection-input-tag__input`,onBlur:this.handlePatternInputBlur,onFocus:this.handlePatternInputFocus,onKeydown:this.handlePatternKeyDown,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),u("span",{ref:"patternInputMirrorRef",class:`${s}-base-selection-input-tag__mirror`},this.pattern)):null,D=k?()=>u("div",{class:`${s}-base-selection-tag-wrapper`,ref:"counterWrapperRef"},u(et,{size:o,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,onMouseleave:this.handleMouseLeaveCounter,disabled:l})):void 0;let N;if(R){const d=this.selectedOptions.length-f;d>0&&(N=u("div",{class:`${s}-base-selection-tag-wrapper`,key:"__counter__"},u(et,{size:o,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,disabled:l},{default:()=>`+${d}`})))}const X=k?a?u(yt,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,getTail:this.getTail,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:z,counter:D,tail:()=>j}):u(yt,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:z,counter:D}):R&&N?z().concat(N):z(),Z=b?()=>u("div",{class:`${s}-base-selection-popover`},k?z():this.selectedOptions.map(F)):void 0,re=b?Object.assign({show:this.showTagsPanel,trigger:"hover",overlap:!0,placement:"top",width:"trigger",onUpdateShow:this.onPopoverUpdateShow,theme:this.mergedTheme.peers.Popover,themeOverrides:this.mergedTheme.peerOverrides.Popover},y):null,ee=(this.selected?!1:this.active?!this.pattern&&!this.isComposing:!0)?u("div",{class:`${s}-base-selection-placeholder ${s}-base-selection-overlay`},u("div",{class:`${s}-base-selection-placeholder__inner`},this.placeholder)):null,ne=a?u("div",{ref:"patternInputWrapperRef",class:`${s}-base-selection-tags`},X,k?null:j,A):u("div",{ref:"multipleElRef",class:`${s}-base-selection-tags`,tabindex:l?void 0:0},X,A);H=u(wn,null,b?u(yn,Object.assign({},re,{scrollable:!0,style:"max-height: calc(var(--v-target-height) * 6.6);"}),{trigger:()=>ne,default:Z}):ne,ee)}else if(a){const I=this.pattern||this.isComposing,F=this.active?!I:!this.selected,z=this.active?!1:this.selected;H=u("div",{ref:"patternInputWrapperRef",class:`${s}-base-selection-label`,title:this.patternInputFocused?void 0:xt(this.label)},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",class:`${s}-base-selection-input`,value:this.active?this.pattern:"",placeholder:"",readonly:l,disabled:l,tabindex:-1,autofocus:this.autofocus,onFocus:this.handlePatternInputFocus,onBlur:this.handlePatternInputBlur,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),z?u("div",{class:`${s}-base-selection-label__render-label ${s}-base-selection-overlay`,key:"input"},u("div",{class:`${s}-base-selection-overlay__wrapper`},x?x({option:this.selectedOption,handleClose:()=>{}}):C?C(this.selectedOption,!0):Te(this.label,this.selectedOption,!0))):null,F?u("div",{class:`${s}-base-selection-placeholder ${s}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${s}-base-selection-overlay__wrapper`},this.filterablePlaceholder)):null,A)}else H=u("div",{ref:"singleElRef",class:`${s}-base-selection-label`,tabindex:this.disabled?void 0:0},this.label!==void 0?u("div",{class:`${s}-base-selection-input`,title:xt(this.label),key:"input"},u("div",{class:`${s}-base-selection-input__content`},x?x({option:this.selectedOption,handleClose:()=>{}}):C?C(this.selectedOption,!0):Te(this.label,this.selectedOption,!0))):u("div",{class:`${s}-base-selection-placeholder ${s}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${s}-base-selection-placeholder__inner`},this.placeholder)),A);return u("div",{ref:"selfRef",class:[`${s}-base-selection`,this.rtlEnabled&&`${s}-base-selection--rtl`,this.themeClass,e&&`${s}-base-selection--${e}-status`,{[`${s}-base-selection--active`]:this.active,[`${s}-base-selection--selected`]:this.selected||this.active&&this.pattern,[`${s}-base-selection--disabled`]:this.disabled,[`${s}-base-selection--multiple`]:this.multiple,[`${s}-base-selection--focus`]:this.focused}],style:this.cssVars,onClick:this.onClick,onMouseenter:this.handleMouseEnter,onMouseleave:this.handleMouseLeave,onKeydown:this.onKeydown,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onMousedown:this.handleMouseDown},H,v?u("div",{class:`${s}-base-selection__border`}):null,v?u("div",{class:`${s}-base-selection__state-border`}):null)}});function qe(e){return e.type==="group"}function Bt(e){return e.type==="ignored"}function ot(e,n){try{return!!(1+n.toString().toLowerCase().indexOf(e.trim().toLowerCase()))}catch{return!1}}function Yn(e,n){return{getIsGroup:qe,getIgnored:Bt,getKey(l){return qe(l)?l.name||l.key||"key-required":l[e]},getChildren(l){return l[n]}}}function Jn(e,n,o,l){if(!n)return e;function a(f){if(!Array.isArray(f))return[];const v=[];for(const s of f)if(qe(s)){const y=a(s[l]);y.length&&v.push(Object.assign({},s,{[l]:y}))}else{if(Bt(s))continue;n(o,s)&&v.push(s)}return v}return a(e)}function Qn(e,n,o){const l=new Map;return e.forEach(a=>{qe(a)?a[o].forEach(f=>{l.set(f[n],f)}):l.set(a[n],a)}),l}const Zn=fe([_("select",`
 z-index: auto;
 outline: none;
 width: 100%;
 position: relative;
 font-weight: var(--n-font-weight);
 `),_("select-menu",`
 margin: 4px 0;
 box-shadow: var(--n-menu-box-shadow);
 `,[Mt({originalTransition:"background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)"})])]),eo=Object.assign(Object.assign({},Me.props),{to:at.propTo,bordered:{type:Boolean,default:void 0},clearable:Boolean,clearCreatedOptionsOnClear:{type:Boolean,default:!0},clearFilterAfterSelect:{type:Boolean,default:!0},options:{type:Array,default:()=>[]},defaultValue:{type:[String,Number,Array],default:null},keyboard:{type:Boolean,default:!0},value:[String,Number,Array],placeholder:String,menuProps:Object,multiple:Boolean,size:String,menuSize:{type:String},filterable:Boolean,disabled:{type:Boolean,default:void 0},remote:Boolean,loading:Boolean,filter:Function,placement:{type:String,default:"bottom-start"},widthMode:{type:String,default:"trigger"},tag:Boolean,onCreate:Function,fallbackOption:{type:[Function,Boolean],default:void 0},show:{type:Boolean,default:void 0},showArrow:{type:Boolean,default:!0},maxTagCount:[Number,String],ellipsisTagPopoverProps:Object,consistentMenuWidth:{type:Boolean,default:!0},virtualScroll:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},childrenField:{type:String,default:"children"},renderLabel:Function,renderOption:Function,renderTag:Function,"onUpdate:value":[Function,Array],inputProps:Object,nodeProps:Function,ignoreComposition:{type:Boolean,default:!0},showOnFocus:Boolean,onUpdateValue:[Function,Array],onBlur:[Function,Array],onClear:[Function,Array],onFocus:[Function,Array],onScroll:[Function,Array],onSearch:[Function,Array],onUpdateShow:[Function,Array],"onUpdate:show":[Function,Array],displayDirective:{type:String,default:"show"},resetMenuOnOptionsChange:{type:Boolean,default:!0},status:String,showCheckmark:{type:Boolean,default:!0},scrollbarProps:Object,onChange:[Function,Array],items:Array}),ro=he({name:"Select",props:eo,slots:Object,setup(e){const{mergedClsPrefixRef:n,mergedBorderedRef:o,namespaceRef:l,inlineThemeDisabled:a,mergedComponentPropsRef:f}=ct(e),v=Me("Select","-select",Zn,Bn,e,n),s=T(e.defaultValue),y=Q(e,"value"),p=bt(y,s),x=T(!1),C=T(""),k=kn(e,["items","options"]),R=T([]),b=T([]),A=$(()=>b.value.concat(R.value).concat(k.value)),H=$(()=>{const{filter:t}=e;if(t)return t;const{labelField:c,valueField:w}=e;return(M,S)=>{if(!S)return!1;const O=S[c];if(typeof O=="string")return ot(M,O);const P=S[w];return typeof P=="string"?ot(M,P):typeof P=="number"?ot(M,String(P)):!1}}),I=$(()=>{if(e.remote)return k.value;{const{value:t}=A,{value:c}=C;return!c.length||!e.filterable?t:Jn(t,H.value,c,e.childrenField)}}),F=$(()=>{const{valueField:t,childrenField:c}=e,w=Yn(t,c);return _n(I.value,w)}),z=$(()=>Qn(A.value,e.valueField,e.childrenField)),j=T(!1),D=bt(Q(e,"show"),j),N=T(null),X=T(null),Z=T(null),{localeRef:re}=En("Select"),ae=$(()=>{var t;return(t=e.placeholder)!==null&&t!==void 0?t:re.value.placeholder}),ee=[],ne=T(new Map),d=$(()=>{const{fallbackOption:t}=e;if(t===void 0){const{labelField:c,valueField:w}=e;return M=>({[c]:String(M),[w]:M})}return t===!1?!1:c=>Object.assign(t(c),{value:c})});function m(t){const c=e.remote,{value:w}=ne,{value:M}=z,{value:S}=d,O=[];return t.forEach(P=>{if(M.has(P))O.push(M.get(P));else if(c&&w.has(P))O.push(w.get(P));else if(S){const J=S(P);J&&O.push(J)}}),O}const B=$(()=>{if(e.multiple){const{value:t}=p;return Array.isArray(t)?m(t):[]}return null}),E=$(()=>{const{value:t}=p;return!e.multiple&&!Array.isArray(t)?t===null?null:m([t])[0]||null:null}),W=Mn(e,{mergedSize:t=>{var c,w;const{size:M}=e;if(M)return M;const{mergedSize:S}=t||{};if(S!=null&&S.value)return S.value;const O=(w=(c=f==null?void 0:f.value)===null||c===void 0?void 0:c.Select)===null||w===void 0?void 0:w.size;return O||"medium"}}),{mergedSizeRef:q,mergedDisabledRef:L,mergedStatusRef:K}=W;function U(t,c){const{onChange:w,"onUpdate:value":M,onUpdateValue:S}=e,{nTriggerFormChange:O,nTriggerFormInput:P}=W;w&&ce(w,t,c),S&&ce(S,t,c),M&&ce(M,t,c),s.value=t,O(),P()}function te(t){const{onBlur:c}=e,{nTriggerFormBlur:w}=W;c&&ce(c,t),w()}function oe(){const{onClear:t}=e;t&&ce(t)}function i(t){const{onFocus:c,showOnFocus:w}=e,{nTriggerFormFocus:M}=W;c&&ce(c,t),M(),w&&ve()}function h(t){const{onSearch:c}=e;c&&ce(c,t)}function G(t){const{onScroll:c}=e;c&&ce(c,t)}function de(){var t;const{remote:c,multiple:w}=e;if(c){const{value:M}=ne;if(w){const{valueField:S}=e;(t=B.value)===null||t===void 0||t.forEach(O=>{M.set(O[S],O)})}else{const S=E.value;S&&M.set(S[e.valueField],S)}}}function Se(t){const{onUpdateShow:c,"onUpdate:show":w}=e;c&&ce(c,t),w&&ce(w,t),j.value=t}function ve(){L.value||(Se(!0),j.value=!0,e.filterable&&De())}function le(){Se(!1)}function Re(){C.value="",b.value=ee}const be=T(!1);function Ie(){e.filterable&&(be.value=!0)}function ze(){e.filterable&&(be.value=!1,D.value||Re())}function Pe(){L.value||(D.value?e.filterable?De():le():ve())}function me(t){var c,w;!((w=(c=Z.value)===null||c===void 0?void 0:c.selfRef)===null||w===void 0)&&w.contains(t.relatedTarget)||(x.value=!1,te(t),le())}function we(t){i(t),x.value=!0}function ke(){x.value=!0}function Be(t){var c;!((c=N.value)===null||c===void 0)&&c.$el.contains(t.relatedTarget)||(x.value=!1,te(t),le())}function _e(){var t;(t=N.value)===null||t===void 0||t.focus(),le()}function Fe(t){var c;D.value&&(!((c=N.value)===null||c===void 0)&&c.$el.contains(zn(t))||le())}function Oe(t){if(!Array.isArray(t))return[];if(d.value)return Array.from(t);{const{remote:c}=e,{value:w}=z;if(c){const{value:M}=ne;return t.filter(S=>w.has(S)||M.has(S))}else return t.filter(M=>w.has(M))}}function se(t){r(t.rawNode)}function r(t){if(L.value)return;const{tag:c,remote:w,clearFilterAfterSelect:M,valueField:S}=e;if(c&&!w){const{value:O}=b,P=O[0]||null;if(P){const J=R.value;J.length?J.push(P):R.value=[P],b.value=ee}}if(w&&ne.value.set(t[S],t),e.multiple){const O=Oe(p.value),P=O.findIndex(J=>J===t[S]);if(~P){if(O.splice(P,1),c&&!w){const J=g(t[S]);~J&&(R.value.splice(J,1),M&&(C.value=""))}}else O.push(t[S]),M&&(C.value="");U(O,m(O))}else{if(c&&!w){const O=g(t[S]);~O?R.value=[R.value[O]]:R.value=ee}We(),le(),U(t[S],t)}}function g(t){return R.value.findIndex(w=>w[e.valueField]===t)}function Y(t){D.value||ve();const{value:c}=t.target;C.value=c;const{tag:w,remote:M}=e;if(h(c),w&&!M){if(!c){b.value=ee;return}const{onCreate:S}=e,O=S?S(c):{[e.labelField]:c,[e.valueField]:c},{valueField:P,labelField:J}=e;k.value.some(ue=>ue[P]===O[P]||ue[J]===O[J])||R.value.some(ue=>ue[P]===O[P]||ue[J]===O[J])?b.value=ee:b.value=[O]}}function Ge(t){t.stopPropagation();const{multiple:c,tag:w,remote:M,clearCreatedOptionsOnClear:S}=e;!c&&e.filterable&&le(),w&&!M&&S&&(R.value=ee),oe(),c?U([],[]):U(null,null)}function Xe(t){!Ae(t,"action")&&!Ae(t,"empty")&&!Ae(t,"header")&&t.preventDefault()}function Ye(t){G(t)}function Le(t){var c,w,M,S,O;if(!e.keyboard){t.preventDefault();return}switch(t.key){case" ":if(e.filterable)break;t.preventDefault();case"Enter":if(!(!((c=N.value)===null||c===void 0)&&c.isComposing)){if(D.value){const P=(w=Z.value)===null||w===void 0?void 0:w.getPendingTmNode();P?se(P):e.filterable||(le(),We())}else if(ve(),e.tag&&be.value){const P=b.value[0];if(P){const J=P[e.valueField],{value:ue}=p;e.multiple&&Array.isArray(ue)&&ue.includes(J)||r(P)}}}t.preventDefault();break;case"ArrowUp":if(t.preventDefault(),e.loading)return;D.value&&((M=Z.value)===null||M===void 0||M.prev());break;case"ArrowDown":if(t.preventDefault(),e.loading)return;D.value?(S=Z.value)===null||S===void 0||S.next():ve();break;case"Escape":D.value&&(Pn(t),le()),(O=N.value)===null||O===void 0||O.focus();break}}function We(){var t;(t=N.value)===null||t===void 0||t.focus()}function De(){var t;(t=N.value)===null||t===void 0||t.focusInput()}function Je(){var t;D.value&&((t=X.value)===null||t===void 0||t.syncPosition())}de(),Ce(Q(e,"options"),de);const Qe={focus:()=>{var t;(t=N.value)===null||t===void 0||t.focus()},focusInput:()=>{var t;(t=N.value)===null||t===void 0||t.focusInput()},blur:()=>{var t;(t=N.value)===null||t===void 0||t.blur()},blurInput:()=>{var t;(t=N.value)===null||t===void 0||t.blurInput()}},Ve=$(()=>{const{self:{menuBoxShadow:t}}=v.value;return{"--n-menu-box-shadow":t}}),pe=a?ft("select",void 0,Ve,e):void 0;return Object.assign(Object.assign({},Qe),{mergedStatus:K,mergedClsPrefix:n,mergedBordered:o,namespace:l,treeMate:F,isMounted:In(),triggerRef:N,menuRef:Z,pattern:C,uncontrolledShow:j,mergedShow:D,adjustedTo:at(e),uncontrolledValue:s,mergedValue:p,followerRef:X,localizedPlaceholder:ae,selectedOption:E,selectedOptions:B,mergedSize:q,mergedDisabled:L,focused:x,activeWithoutMenuOpen:be,inlineThemeDisabled:a,onTriggerInputFocus:Ie,onTriggerInputBlur:ze,handleTriggerOrMenuResize:Je,handleMenuFocus:ke,handleMenuBlur:Be,handleMenuTabOut:_e,handleTriggerClick:Pe,handleToggle:se,handleDeleteOption:r,handlePatternInput:Y,handleClear:Ge,handleTriggerBlur:me,handleTriggerFocus:we,handleKeydown:Le,handleMenuAfterLeave:Re,handleMenuClickOutside:Fe,handleMenuScroll:Ye,handleMenuKeydown:Le,handleMenuMousedown:Xe,mergedTheme:v,cssVars:a?void 0:Ve,themeClass:pe==null?void 0:pe.themeClass,onRender:pe==null?void 0:pe.onRender})},render(){return u("div",{class:`${this.mergedClsPrefix}-select`},u(Sn,null,{default:()=>[u(Rn,null,{default:()=>u(Xn,{ref:"triggerRef",inlineThemeDisabled:this.inlineThemeDisabled,status:this.mergedStatus,inputProps:this.inputProps,clsPrefix:this.mergedClsPrefix,showArrow:this.showArrow,maxTagCount:this.maxTagCount,ellipsisTagPopoverProps:this.ellipsisTagPopoverProps,bordered:this.mergedBordered,active:this.activeWithoutMenuOpen||this.mergedShow,pattern:this.pattern,placeholder:this.localizedPlaceholder,selectedOption:this.selectedOption,selectedOptions:this.selectedOptions,multiple:this.multiple,renderTag:this.renderTag,renderLabel:this.renderLabel,filterable:this.filterable,clearable:this.clearable,disabled:this.mergedDisabled,size:this.mergedSize,theme:this.mergedTheme.peers.InternalSelection,labelField:this.labelField,valueField:this.valueField,themeOverrides:this.mergedTheme.peerOverrides.InternalSelection,loading:this.loading,focused:this.focused,onClick:this.handleTriggerClick,onDeleteOption:this.handleDeleteOption,onPatternInput:this.handlePatternInput,onClear:this.handleClear,onBlur:this.handleTriggerBlur,onFocus:this.handleTriggerFocus,onKeydown:this.handleKeydown,onPatternBlur:this.onTriggerInputBlur,onPatternFocus:this.onTriggerInputFocus,onResize:this.handleTriggerOrMenuResize,ignoreComposition:this.ignoreComposition},{arrow:()=>{var e,n;return[(n=(e=this.$slots).arrow)===null||n===void 0?void 0:n.call(e)]}})}),u(Fn,{ref:"followerRef",show:this.mergedShow,to:this.adjustedTo,teleportDisabled:this.adjustedTo===at.tdkey,containerClass:this.namespace,width:this.consistentMenuWidth?"target":void 0,minWidth:"target",placement:this.placement},{default:()=>u(Tt,{name:"fade-in-scale-up-transition",appear:this.isMounted,onAfterLeave:this.handleMenuAfterLeave},{default:()=>{var e,n,o;return this.mergedShow||this.displayDirective==="show"?((e=this.onRender)===null||e===void 0||e.call(this),On(u(qn,Object.assign({},this.menuProps,{ref:"menuRef",onResize:this.handleTriggerOrMenuResize,inlineThemeDisabled:this.inlineThemeDisabled,virtualScroll:this.consistentMenuWidth&&this.virtualScroll,class:[`${this.mergedClsPrefix}-select-menu`,this.themeClass,(n=this.menuProps)===null||n===void 0?void 0:n.class],clsPrefix:this.mergedClsPrefix,focusable:!0,labelField:this.labelField,valueField:this.valueField,autoPending:!0,nodeProps:this.nodeProps,theme:this.mergedTheme.peers.InternalSelectMenu,themeOverrides:this.mergedTheme.peerOverrides.InternalSelectMenu,treeMate:this.treeMate,multiple:this.multiple,size:this.menuSize,renderOption:this.renderOption,renderLabel:this.renderLabel,value:this.mergedValue,style:[(o=this.menuProps)===null||o===void 0?void 0:o.style,this.cssVars],onToggle:this.handleToggle,onScroll:this.handleMenuScroll,onFocus:this.handleMenuFocus,onBlur:this.handleMenuBlur,onKeydown:this.handleMenuKeydown,onTabOut:this.handleMenuTabOut,onMousedown:this.handleMenuMousedown,show:this.mergedShow,showCheckmark:this.showCheckmark,resetMenuOnOptionsChange:this.resetMenuOnOptionsChange,scrollbarProps:this.scrollbarProps}),{empty:()=>{var l,a;return[(a=(l=this.$slots).empty)===null||a===void 0?void 0:a.call(l)]},header:()=>{var l,a;return[(a=(l=this.$slots).header)===null||a===void 0?void 0:a.call(l)]},action:()=>{var l,a;return[(a=(l=this.$slots).action)===null||a===void 0?void 0:a.call(l)]}}),this.displayDirective==="show"?[[Tn,this.mergedShow],[gt,this.handleMenuClickOutside,void 0,{capture:!0}]]:[[gt,this.handleMenuClickOutside,void 0,{capture:!0}]])):null}})})]}))}});export{Hn as F,ro as N,Dn as V,qn as a,Yn as c,nt as m};
