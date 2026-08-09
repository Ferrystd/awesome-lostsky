import{az as Te,k as E,M as O,af as Xe,d as ue,a0 as vo,m as a,aP as wo,v as gt,bo as Mo,bp as Bo,U as He,bq as bt,aD as pt,aw as ho,aZ as mt,br as Ge,a4 as ne,aO as Ae,a3 as go,N as Ct,bs as io,q as Fe,V as $o,b1 as xt,$ as W,ag as se,ax as _,aW as wt,aG as yt,aj as bo,ak as po,aE as St,W as mo,at as kt,Y as Je,bt as Oe,bu as Co,a_ as _o,ah as Q,ai as ze,aV as Eo,aA as Ye,aH as Lo,aJ as Rt,a1 as Qe,an as xo,a2 as Se,a5 as eo,a7 as We,bv as zt,ap as te,bn as Me,bw as Tt,ar as D,bx as Ft,a8 as ge,by as yo,Z as Pt,X as It,bz as Ot,F as Mt,aa as Bt,am as $t,b5 as _t,b6 as Et,b7 as Lt,ao as fo,b8 as At,bA as Wt,b9 as So,al as ko,ay as Ht,bc as Nt,ba as Dt,bd as jt,bB as Vt,a9 as Ut}from"./index-Cc2RDGAd.js";import{e as Kt,N as qt,u as Gt}from"./Empty-CYjIe5RW.js";function Ro(e){return e&-e}class Ao{constructor(n,t){this.l=n,this.min=t;const i=new Array(n+1);for(let l=0;l<n+1;++l)i[l]=0;this.ft=i}add(n,t){if(t===0)return;const{l:i,ft:l}=this;for(n+=1;n<=i;)l[n]+=t,n+=Ro(n)}get(n){return this.sum(n+1)-this.sum(n)}sum(n){if(n===void 0&&(n=this.l),n<=0)return 0;const{ft:t,min:i,l}=this;if(n>l)throw new Error("[FinweckTree.sum]: `i` is larger than length.");let d=n*i;for(;n>0;)d+=t[n],n-=Ro(n);return d}getBound(n){let t=0,i=this.l;for(;i>t;){const l=Math.floor((t+i)/2),d=this.sum(l);if(d>n){i=l;continue}else if(d<n){if(t===l)return this.sum(t+1)<=n?t+1:l;t=l}else return l}return t}}let qe;function Xt(){return typeof document>"u"?!1:(qe===void 0&&("matchMedia"in window?qe=window.matchMedia("(pointer:coarse)").matches:qe=!1),qe)}let ao;function zo(){return typeof document>"u"?1:(ao===void 0&&(ao="chrome"in window?window.devicePixelRatio:1),ao)}const Wo="VVirtualListXScroll";function Yt({columnsRef:e,renderColRef:n,renderItemWithColsRef:t}){const i=O(0),l=O(0),d=E(()=>{const m=e.value;if(m.length===0)return null;const x=new Ao(m.length,0);return m.forEach((w,I)=>{x.add(I,w.width)}),x}),s=Te(()=>{const m=d.value;return m!==null?Math.max(m.getBound(l.value)-1,0):0}),r=m=>{const x=d.value;return x!==null?x.sum(m):0},v=Te(()=>{const m=d.value;return m!==null?Math.min(m.getBound(l.value+i.value)+1,e.value.length-1):0});return Xe(Wo,{startIndexRef:s,endIndexRef:v,columnsRef:e,renderColRef:n,renderItemWithColsRef:t,getLeft:r}),{listWidthRef:i,scrollLeftRef:l}}const To=ue({name:"VirtualListRow",props:{index:{type:Number,required:!0},item:{type:Object,required:!0}},setup(){const{startIndexRef:e,endIndexRef:n,columnsRef:t,getLeft:i,renderColRef:l,renderItemWithColsRef:d}=vo(Wo);return{startIndex:e,endIndex:n,columns:t,renderCol:l,renderItemWithCols:d,getLeft:i}},render(){const{startIndex:e,endIndex:n,columns:t,renderCol:i,renderItemWithCols:l,getLeft:d,item:s}=this;if(l!=null)return l({itemIndex:this.index,startColIndex:e,endColIndex:n,allColumns:t,item:s,getLeft:d});if(i!=null){const r=[];for(let v=e;v<=n;++v){const m=t[v];r.push(i({column:m,left:d(v),item:s}))}return r}return null}}),Zt=Ge(".v-vl",{maxHeight:"inherit",height:"100%",overflow:"auto",minWidth:"1px"},[Ge("&:not(.v-vl--show-scrollbar)",{scrollbarWidth:"none"},[Ge("&::-webkit-scrollbar, &::-webkit-scrollbar-track-piece, &::-webkit-scrollbar-thumb",{width:0,height:0,display:"none"})])]),Jt=ue({name:"VirtualList",inheritAttrs:!1,props:{showScrollbar:{type:Boolean,default:!0},columns:{type:Array,default:()=>[]},renderCol:Function,renderItemWithCols:Function,items:{type:Array,default:()=>[]},itemSize:{type:Number,required:!0},itemResizable:Boolean,itemsStyle:[String,Object],visibleItemsTag:{type:[String,Object],default:"div"},visibleItemsProps:Object,ignoreItemResize:Boolean,onScroll:Function,onWheel:Function,onResize:Function,defaultScrollKey:[Number,String],defaultScrollIndex:Number,keyField:{type:String,default:"key"},paddingTop:{type:[Number,String],default:0},paddingBottom:{type:[Number,String],default:0}},setup(e){const n=Mo();Zt.mount({id:"vueuc/virtual-list",head:!0,anchorMetaName:Bo,ssr:n}),He(()=>{const{defaultScrollIndex:h,defaultScrollKey:S}=e;h!=null?T({index:h}):S!=null&&T({key:S})});let t=!1,i=!1;bt(()=>{if(t=!1,!i){i=!0;return}T({top:z.value,left:s.value})}),pt(()=>{t=!0,i||(i=!0)});const l=Te(()=>{if(e.renderCol==null&&e.renderItemWithCols==null||e.columns.length===0)return;let h=0;return e.columns.forEach(S=>{h+=S.width}),h}),d=E(()=>{const h=new Map,{keyField:S}=e;return e.items.forEach((A,j)=>{h.set(A[S],j)}),h}),{scrollLeftRef:s,listWidthRef:r}=Yt({columnsRef:ne(e,"columns"),renderColRef:ne(e,"renderCol"),renderItemWithColsRef:ne(e,"renderItemWithCols")}),v=O(null),m=O(void 0),x=new Map,w=E(()=>{const{items:h,itemSize:S,keyField:A}=e,j=new Ao(h.length,S);return h.forEach((U,Y)=>{const V=U[A],q=x.get(V);q!==void 0&&j.add(Y,q)}),j}),I=O(0),z=O(0),g=Te(()=>Math.max(w.value.getBound(z.value-ho(e.paddingTop))-1,0)),b=E(()=>{const{value:h}=m;if(h===void 0)return[];const{items:S,itemSize:A}=e,j=g.value,U=Math.min(j+Math.ceil(h/A+1),S.length-1),Y=[];for(let V=j;V<=U;++V)Y.push(S[V]);return Y}),T=(h,S)=>{if(typeof h=="number"){H(h,S,"auto");return}const{left:A,top:j,index:U,key:Y,position:V,behavior:q,debounce:G=!0}=h;if(A!==void 0||j!==void 0)H(A,j,q);else if(U!==void 0)F(U,q,G);else if(Y!==void 0){const ae=d.value.get(Y);ae!==void 0&&F(ae,q,G)}else V==="bottom"?H(0,Number.MAX_SAFE_INTEGER,q):V==="top"&&H(0,0,q)};let k,y=null;function F(h,S,A){const{value:j}=w,U=j.sum(h)+ho(e.paddingTop);if(!A)v.value.scrollTo({left:0,top:U,behavior:S});else{k=h,y!==null&&window.clearTimeout(y),y=window.setTimeout(()=>{k=void 0,y=null},16);const{scrollTop:Y,offsetHeight:V}=v.value;if(U>Y){const q=j.get(h);U+q<=Y+V||v.value.scrollTo({left:0,top:U+q-V,behavior:S})}else v.value.scrollTo({left:0,top:U,behavior:S})}}function H(h,S,A){v.value.scrollTo({left:h,top:S,behavior:A})}function N(h,S){var A,j,U;if(t||e.ignoreItemResize||ee(S.target))return;const{value:Y}=w,V=d.value.get(h),q=Y.get(V),G=(U=(j=(A=S.borderBoxSize)===null||A===void 0?void 0:A[0])===null||j===void 0?void 0:j.blockSize)!==null&&U!==void 0?U:S.contentRect.height;if(G===q)return;G-e.itemSize===0?x.delete(h):x.set(h,G-e.itemSize);const ce=G-q;if(ce===0)return;Y.add(V,ce);const c=v.value;if(c!=null){if(k===void 0){const p=Y.sum(V);c.scrollTop>p&&c.scrollBy(0,ce)}else if(V<k)c.scrollBy(0,ce);else if(V===k){const p=Y.sum(V);G+p>c.scrollTop+c.offsetHeight&&c.scrollBy(0,ce)}J()}I.value++}const L=!Xt();let K=!1;function X(h){var S;(S=e.onScroll)===null||S===void 0||S.call(e,h),(!L||!K)&&J()}function re(h){var S;if((S=e.onWheel)===null||S===void 0||S.call(e,h),L){const A=v.value;if(A!=null){if(h.deltaX===0&&(A.scrollTop===0&&h.deltaY<=0||A.scrollTop+A.offsetHeight>=A.scrollHeight&&h.deltaY>=0))return;h.preventDefault(),A.scrollTop+=h.deltaY/zo(),A.scrollLeft+=h.deltaX/zo(),J(),K=!0,mt(()=>{K=!1})}}}function ie(h){if(t||ee(h.target))return;if(e.renderCol==null&&e.renderItemWithCols==null){if(h.contentRect.height===m.value)return}else if(h.contentRect.height===m.value&&h.contentRect.width===r.value)return;m.value=h.contentRect.height,r.value=h.contentRect.width;const{onResize:S}=e;S!==void 0&&S(h)}function J(){const{value:h}=v;h!=null&&(z.value=h.scrollTop,s.value=h.scrollLeft)}function ee(h){let S=h;for(;S!==null;){if(S.style.display==="none")return!0;S=S.parentElement}return!1}return{listHeight:m,listStyle:{overflow:"auto"},keyToIndex:d,itemsStyle:E(()=>{const{itemResizable:h}=e,S=Ae(w.value.sum());return I.value,[e.itemsStyle,{boxSizing:"content-box",width:Ae(l.value),height:h?"":S,minHeight:h?S:"",paddingTop:Ae(e.paddingTop),paddingBottom:Ae(e.paddingBottom)}]}),visibleItemsStyle:E(()=>(I.value,{transform:`translateY(${Ae(w.value.sum(g.value))})`})),viewportItems:b,listElRef:v,itemsElRef:O(null),scrollTo:T,handleListResize:ie,handleListScroll:X,handleListWheel:re,handleItemResize:N}},render(){const{itemResizable:e,keyField:n,keyToIndex:t,visibleItemsTag:i}=this;return a(wo,{onResize:this.handleListResize},{default:()=>{var l,d;return a("div",gt(this.$attrs,{class:["v-vl",this.showScrollbar&&"v-vl--show-scrollbar"],onScroll:this.handleListScroll,onWheel:this.handleListWheel,ref:"listElRef"}),[this.items.length!==0?a("div",{ref:"itemsElRef",class:"v-vl-items",style:this.itemsStyle},[a(i,Object.assign({class:"v-vl-visible-items",style:this.visibleItemsStyle},this.visibleItemsProps),{default:()=>{const{renderCol:s,renderItemWithCols:r}=this;return this.viewportItems.map(v=>{const m=v[n],x=t.get(m),w=s!=null?a(To,{index:x,item:v}):void 0,I=r!=null?a(To,{index:x,item:v}):void 0,z=this.$slots.default({item:v,renderedCols:w,renderedItemWithCols:I,index:x})[0];return e?a(wo,{key:m,onResize:g=>this.handleItemResize(m,g)},{default:()=>z}):(z.key=m,z)})}})]):(d=(l=this.$slots).empty)===null||d===void 0?void 0:d.call(l)])}})}}),xe="v-hidden",Qt=Ge("[v-hidden]",{display:"none!important"}),Fo=ue({name:"Overflow",props:{getCounter:Function,getTail:Function,updateCounter:Function,onUpdateCount:Function,onUpdateOverflow:Function},setup(e,{slots:n}){const t=O(null),i=O(null);function l(s){const{value:r}=t,{getCounter:v,getTail:m}=e;let x;if(v!==void 0?x=v():x=i.value,!r||!x)return;x.hasAttribute(xe)&&x.removeAttribute(xe);const{children:w}=r;if(s.showAllItemsBeforeCalculate)for(const F of w)F.hasAttribute(xe)&&F.removeAttribute(xe);const I=r.offsetWidth,z=[],g=n.tail?m==null?void 0:m():null;let b=g?g.offsetWidth:0,T=!1;const k=r.children.length-(n.tail?1:0);for(let F=0;F<k-1;++F){if(F<0)continue;const H=w[F];if(T){H.hasAttribute(xe)||H.setAttribute(xe,"");continue}else H.hasAttribute(xe)&&H.removeAttribute(xe);const N=H.offsetWidth;if(b+=N,z[F]=N,b>I){const{updateCounter:L}=e;for(let K=F;K>=0;--K){const X=k-1-K;L!==void 0?L(X):x.textContent=`${X}`;const re=x.offsetWidth;if(b-=z[K],b+re<=I||K===0){T=!0,F=K-1,g&&(F===-1?(g.style.maxWidth=`${I-re}px`,g.style.boxSizing="border-box"):g.style.maxWidth="");const{onUpdateCount:ie}=e;ie&&ie(X);break}}}}const{onUpdateOverflow:y}=e;T?y!==void 0&&y(!0):(y!==void 0&&y(!1),x.setAttribute(xe,""))}const d=Mo();return Qt.mount({id:"vueuc/overflow",head:!0,anchorMetaName:Bo,ssr:d}),He(()=>l({showAllItemsBeforeCalculate:!1})),{selfRef:t,counterRef:i,sync:l}},render(){const{$slots:e}=this;return go(()=>this.sync({showAllItemsBeforeCalculate:!1})),a("div",{class:"v-overflow",ref:"selfRef"},[Ct(e,"default"),e.counter?e.counter():a("span",{style:{display:"inline-block"},ref:"counterRef"}),e.tail?e.tail():null])}});function Ho(e,n){n&&(He(()=>{const{value:t}=e;t&&io.registerHandler(t,n)}),Fe(e,(t,i)=>{i&&io.unregisterHandler(i)},{deep:!1}),$o(()=>{const{value:t}=e;t&&io.unregisterHandler(t)}))}function Po(e){switch(typeof e){case"string":return e||void 0;case"number":return String(e);default:return}}function so(e){const n=e.filter(t=>t!==void 0);if(n.length!==0)return n.length===1?n[0]:t=>{e.forEach(i=>{i&&i(t)})}}const en=ue({name:"Checkmark",render(){return a("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},a("g",{fill:"none"},a("path",{d:"M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",fill:"currentColor"})))}}),on=ue({name:"ChevronDown",render(){return a("svg",{viewBox:"0 0 16 16",fill:"none",xmlns:"http://www.w3.org/2000/svg"},a("path",{d:"M3.14645 5.64645C3.34171 5.45118 3.65829 5.45118 3.85355 5.64645L8 9.79289L12.1464 5.64645C12.3417 5.45118 12.6583 5.45118 12.8536 5.64645C13.0488 5.84171 13.0488 6.15829 12.8536 6.35355L8.35355 10.8536C8.15829 11.0488 7.84171 11.0488 7.64645 10.8536L3.14645 6.35355C2.95118 6.15829 2.95118 5.84171 3.14645 5.64645Z",fill:"currentColor"}))}}),tn=xt("clear",()=>a("svg",{viewBox:"0 0 16 16",version:"1.1",xmlns:"http://www.w3.org/2000/svg"},a("g",{stroke:"none","stroke-width":"1",fill:"none","fill-rule":"evenodd"},a("g",{fill:"currentColor","fill-rule":"nonzero"},a("path",{d:"M8,2 C11.3137085,2 14,4.6862915 14,8 C14,11.3137085 11.3137085,14 8,14 C4.6862915,14 2,11.3137085 2,8 C2,4.6862915 4.6862915,2 8,2 Z M6.5343055,5.83859116 C6.33943736,5.70359511 6.07001296,5.72288026 5.89644661,5.89644661 L5.89644661,5.89644661 L5.83859116,5.9656945 C5.70359511,6.16056264 5.72288026,6.42998704 5.89644661,6.60355339 L5.89644661,6.60355339 L7.293,8 L5.89644661,9.39644661 L5.83859116,9.4656945 C5.70359511,9.66056264 5.72288026,9.92998704 5.89644661,10.1035534 L5.89644661,10.1035534 L5.9656945,10.1614088 C6.16056264,10.2964049 6.42998704,10.2771197 6.60355339,10.1035534 L6.60355339,10.1035534 L8,8.707 L9.39644661,10.1035534 L9.4656945,10.1614088 C9.66056264,10.2964049 9.92998704,10.2771197 10.1035534,10.1035534 L10.1035534,10.1035534 L10.1614088,10.0343055 C10.2964049,9.83943736 10.2771197,9.57001296 10.1035534,9.39644661 L10.1035534,9.39644661 L8.707,8 L10.1035534,6.60355339 L10.1614088,6.5343055 C10.2964049,6.33943736 10.2771197,6.07001296 10.1035534,5.89644661 L10.1035534,5.89644661 L10.0343055,5.83859116 C9.83943736,5.70359511 9.57001296,5.72288026 9.39644661,5.89644661 L9.39644661,5.89644661 L8,7.293 L6.60355339,5.89644661 Z"}))))),nn=W("base-clear",`
 flex-shrink: 0;
 height: 1em;
 width: 1em;
 position: relative;
`,[se(">",[_("clear",`
 font-size: var(--n-clear-size);
 height: 1em;
 width: 1em;
 cursor: pointer;
 color: var(--n-clear-color);
 transition: color .3s var(--n-bezier);
 display: flex;
 `,[se("&:hover",`
 color: var(--n-clear-color-hover)!important;
 `),se("&:active",`
 color: var(--n-clear-color-pressed)!important;
 `)]),_("placeholder",`
 display: flex;
 `),_("clear, placeholder",`
 position: absolute;
 left: 50%;
 top: 50%;
 transform: translateX(-50%) translateY(-50%);
 `,[wt({originalTransform:"translateX(-50%) translateY(-50%)",left:"50%",top:"50%"})])])]),ln=ue({name:"BaseClear",props:{clsPrefix:{type:String,required:!0},show:Boolean,onClear:Function},setup(e){return St("-base-clear",nn,ne(e,"clsPrefix")),{handleMouseDown(n){n.preventDefault()}}},render(){const{clsPrefix:e}=this;return a("div",{class:`${e}-base-clear`},a(yt,null,{default:()=>{var n,t;return this.show?a("div",{key:"dismiss",class:`${e}-base-clear__clear`,onClick:this.onClear,onMousedown:this.handleMouseDown,"data-clear":!0},bo(this.$slots.icon,()=>[a(po,{clsPrefix:e},{default:()=>a(tn,null)})])):a("div",{key:"icon",class:`${e}-base-clear__placeholder`},(t=(n=this.$slots).placeholder)===null||t===void 0?void 0:t.call(n))}}))}}),rn=ue({props:{onFocus:Function,onBlur:Function},setup(e){return()=>a("div",{style:"width: 0; height: 0",tabindex:0,onFocus:e.onFocus,onBlur:e.onBlur})}}),an={height:"calc(var(--n-option-height) * 7.6)",paddingTiny:"4px 0",paddingSmall:"4px 0",paddingMedium:"4px 0",paddingLarge:"4px 0",paddingHuge:"4px 0",optionPaddingTiny:"0 12px",optionPaddingSmall:"0 12px",optionPaddingMedium:"0 12px",optionPaddingLarge:"0 12px",optionPaddingHuge:"0 12px",loadingSize:"18px"};function sn(e){const{borderRadius:n,popoverColor:t,textColor3:i,dividerColor:l,textColor2:d,primaryColorPressed:s,textColorDisabled:r,primaryColor:v,opacityDisabled:m,hoverColor:x,fontSizeTiny:w,fontSizeSmall:I,fontSizeMedium:z,fontSizeLarge:g,fontSizeHuge:b,heightTiny:T,heightSmall:k,heightMedium:y,heightLarge:F,heightHuge:H}=e;return Object.assign(Object.assign({},an),{optionFontSizeTiny:w,optionFontSizeSmall:I,optionFontSizeMedium:z,optionFontSizeLarge:g,optionFontSizeHuge:b,optionHeightTiny:T,optionHeightSmall:k,optionHeightMedium:y,optionHeightLarge:F,optionHeightHuge:H,borderRadius:n,color:t,groupHeaderTextColor:i,actionDividerColor:l,optionTextColor:d,optionTextColorPressed:s,optionTextColorDisabled:r,optionTextColorActive:v,optionOpacityDisabled:m,optionCheckColor:v,optionColorPending:x,optionColorActive:"rgba(0, 0, 0, 0)",optionColorActivePending:x,actionTextColor:d,loadingColor:v})}const No=mo({name:"InternalSelectMenu",common:Je,peers:{Scrollbar:kt,Empty:Kt},self:sn}),Io=ue({name:"NBaseSelectGroupHeader",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(){const{renderLabelRef:e,renderOptionRef:n,labelFieldRef:t,nodePropsRef:i}=vo(Co);return{labelField:t,nodeProps:i,renderLabel:e,renderOption:n}},render(){const{clsPrefix:e,renderLabel:n,renderOption:t,nodeProps:i,tmNode:{rawNode:l}}=this,d=i==null?void 0:i(l),s=n?n(l,!1):Oe(l[this.labelField],l,!1),r=a("div",Object.assign({},d,{class:[`${e}-base-select-group-header`,d==null?void 0:d.class]}),s);return l.render?l.render({node:r,option:l}):t?t({node:r,option:l,selected:!1}):r}});function cn(e,n){return a(_o,{name:"fade-in-scale-up-transition"},{default:()=>e?a(po,{clsPrefix:n,class:`${n}-base-select-option__check`},{default:()=>a(en)}):null})}const Oo=ue({name:"NBaseSelectOption",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(e){const{valueRef:n,pendingTmNodeRef:t,multipleRef:i,valueSetRef:l,renderLabelRef:d,renderOptionRef:s,labelFieldRef:r,valueFieldRef:v,showCheckmarkRef:m,nodePropsRef:x,handleOptionClick:w,handleOptionMouseEnter:I}=vo(Co),z=Te(()=>{const{value:k}=t;return k?e.tmNode.key===k.key:!1});function g(k){const{tmNode:y}=e;y.disabled||w(k,y)}function b(k){const{tmNode:y}=e;y.disabled||I(k,y)}function T(k){const{tmNode:y}=e,{value:F}=z;y.disabled||F||I(k,y)}return{multiple:i,isGrouped:Te(()=>{const{tmNode:k}=e,{parent:y}=k;return y&&y.rawNode.type==="group"}),showCheckmark:m,nodeProps:x,isPending:z,isSelected:Te(()=>{const{value:k}=n,{value:y}=i;if(k===null)return!1;const F=e.tmNode.rawNode[v.value];if(y){const{value:H}=l;return H.has(F)}else return k===F}),labelField:r,renderLabel:d,renderOption:s,handleMouseMove:T,handleMouseEnter:b,handleClick:g}},render(){const{clsPrefix:e,tmNode:{rawNode:n},isSelected:t,isPending:i,isGrouped:l,showCheckmark:d,nodeProps:s,renderOption:r,renderLabel:v,handleClick:m,handleMouseEnter:x,handleMouseMove:w}=this,I=cn(t,e),z=v?[v(n,t),d&&I]:[Oe(n[this.labelField],n,t),d&&I],g=s==null?void 0:s(n),b=a("div",Object.assign({},g,{class:[`${e}-base-select-option`,n.class,g==null?void 0:g.class,{[`${e}-base-select-option--disabled`]:n.disabled,[`${e}-base-select-option--selected`]:t,[`${e}-base-select-option--grouped`]:l,[`${e}-base-select-option--pending`]:i,[`${e}-base-select-option--show-checkmark`]:d}],style:[(g==null?void 0:g.style)||"",n.style||""],onClick:so([m,g==null?void 0:g.onClick]),onMouseenter:so([x,g==null?void 0:g.onMouseenter]),onMousemove:so([w,g==null?void 0:g.onMousemove])}),a("div",{class:`${e}-base-select-option__content`},z));return n.render?n.render({node:b,option:n,selected:t}):r?r({node:b,option:n,selected:t}):b}}),dn=W("base-select-menu",`
 line-height: 1.5;
 outline: none;
 z-index: 0;
 position: relative;
 border-radius: var(--n-border-radius);
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-color);
`,[W("scrollbar",`
 max-height: var(--n-height);
 `),W("virtual-list",`
 max-height: var(--n-height);
 `),W("base-select-option",`
 min-height: var(--n-option-height);
 font-size: var(--n-option-font-size);
 display: flex;
 align-items: center;
 `,[_("content",`
 z-index: 1;
 white-space: nowrap;
 text-overflow: ellipsis;
 overflow: hidden;
 `)]),W("base-select-group-header",`
 min-height: var(--n-option-height);
 font-size: .93em;
 display: flex;
 align-items: center;
 `),W("base-select-menu-option-wrapper",`
 position: relative;
 width: 100%;
 `),_("loading, empty",`
 display: flex;
 padding: 12px 32px;
 flex: 1;
 justify-content: center;
 `),_("loading",`
 color: var(--n-loading-color);
 font-size: var(--n-loading-size);
 `),_("header",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-bottom: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),_("action",`
 padding: 8px var(--n-option-padding-left);
 font-size: var(--n-option-font-size);
 transition: 
 color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 border-top: 1px solid var(--n-action-divider-color);
 color: var(--n-action-text-color);
 `),W("base-select-group-header",`
 position: relative;
 cursor: default;
 padding: var(--n-option-padding);
 color: var(--n-group-header-text-color);
 `),W("base-select-option",`
 cursor: pointer;
 position: relative;
 padding: var(--n-option-padding);
 transition:
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 box-sizing: border-box;
 color: var(--n-option-text-color);
 opacity: 1;
 `,[Q("show-checkmark",`
 padding-right: calc(var(--n-option-padding-right) + 20px);
 `),se("&::before",`
 content: "";
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),se("&:active",`
 color: var(--n-option-text-color-pressed);
 `),Q("grouped",`
 padding-left: calc(var(--n-option-padding-left) * 1.5);
 `),Q("pending",[se("&::before",`
 background-color: var(--n-option-color-pending);
 `)]),Q("selected",`
 color: var(--n-option-text-color-active);
 `,[se("&::before",`
 background-color: var(--n-option-color-active);
 `),Q("pending",[se("&::before",`
 background-color: var(--n-option-color-active-pending);
 `)])]),Q("disabled",`
 cursor: not-allowed;
 `,[ze("selected",`
 color: var(--n-option-text-color-disabled);
 `),Q("selected",`
 opacity: var(--n-option-opacity-disabled);
 `)]),_("check",`
 font-size: 16px;
 position: absolute;
 right: calc(var(--n-option-padding-right) - 4px);
 top: calc(50% - 7px);
 color: var(--n-option-check-color);
 transition: color .3s var(--n-bezier);
 `,[Eo({enterScale:"0.5"})])])]),un=ue({name:"InternalSelectMenu",props:Object.assign(Object.assign({},Se.props),{clsPrefix:{type:String,required:!0},scrollable:{type:Boolean,default:!0},treeMate:{type:Object,required:!0},multiple:Boolean,size:{type:String,default:"medium"},value:{type:[String,Number,Array],default:null},autoPending:Boolean,virtualScroll:{type:Boolean,default:!0},show:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},loading:Boolean,focusable:Boolean,renderLabel:Function,renderOption:Function,nodeProps:Function,showCheckmark:{type:Boolean,default:!0},onMousedown:Function,onScroll:Function,onFocus:Function,onBlur:Function,onKeyup:Function,onKeydown:Function,onTabOut:Function,onMouseenter:Function,onMouseleave:Function,onResize:Function,resetMenuOnOptionsChange:{type:Boolean,default:!0},inlineThemeDisabled:Boolean,scrollbarProps:Object,onToggle:Function}),setup(e){const{mergedClsPrefixRef:n,mergedRtlRef:t,mergedComponentPropsRef:i}=Qe(e),l=xo("InternalSelectMenu",t,n),d=Se("InternalSelectMenu","-internal-select-menu",dn,No,e,ne(e,"clsPrefix")),s=O(null),r=O(null),v=O(null),m=E(()=>e.treeMate.getFlattenedNodes()),x=E(()=>zt(m.value)),w=O(null);function I(){const{treeMate:c}=e;let p=null;const{value:Z}=e;Z===null?p=c.getFirstAvailableNode():(e.multiple?p=c.getNode((Z||[])[(Z||[]).length-1]):p=c.getNode(Z),(!p||p.disabled)&&(p=c.getFirstAvailableNode())),j(p||null)}function z(){const{value:c}=w;c&&!e.treeMate.getNode(c.key)&&(w.value=null)}let g;Fe(()=>e.show,c=>{c?g=Fe(()=>e.treeMate,()=>{e.resetMenuOnOptionsChange?(e.autoPending?I():z(),go(U)):z()},{immediate:!0}):g==null||g()},{immediate:!0}),$o(()=>{g==null||g()});const b=E(()=>ho(d.value.self[te("optionHeight",e.size)])),T=E(()=>Me(d.value.self[te("padding",e.size)])),k=E(()=>e.multiple&&Array.isArray(e.value)?new Set(e.value):new Set),y=E(()=>{const c=m.value;return c&&c.length===0}),F=E(()=>{var c,p;return(p=(c=i==null?void 0:i.value)===null||c===void 0?void 0:c.Select)===null||p===void 0?void 0:p.renderEmpty});function H(c){const{onToggle:p}=e;p&&p(c)}function N(c){const{onScroll:p}=e;p&&p(c)}function L(c){var p;(p=v.value)===null||p===void 0||p.sync(),N(c)}function K(){var c;(c=v.value)===null||c===void 0||c.sync()}function X(){const{value:c}=w;return c||null}function re(c,p){p.disabled||j(p,!1)}function ie(c,p){p.disabled||H(p)}function J(c){var p;We(c,"action")||(p=e.onKeyup)===null||p===void 0||p.call(e,c)}function ee(c){var p;We(c,"action")||(p=e.onKeydown)===null||p===void 0||p.call(e,c)}function h(c){var p;(p=e.onMousedown)===null||p===void 0||p.call(e,c),!e.focusable&&c.preventDefault()}function S(){const{value:c}=w;c&&j(c.getNext({loop:!0}),!0)}function A(){const{value:c}=w;c&&j(c.getPrev({loop:!0}),!0)}function j(c,p=!1){w.value=c,p&&U()}function U(){var c,p;const Z=w.value;if(!Z)return;const he=x.value(Z.key);he!==null&&(e.virtualScroll?(c=r.value)===null||c===void 0||c.scrollTo({index:he}):(p=v.value)===null||p===void 0||p.scrollTo({index:he,elSize:b.value}))}function Y(c){var p,Z;!((p=s.value)===null||p===void 0)&&p.contains(c.target)&&((Z=e.onFocus)===null||Z===void 0||Z.call(e,c))}function V(c){var p,Z;!((p=s.value)===null||p===void 0)&&p.contains(c.relatedTarget)||(Z=e.onBlur)===null||Z===void 0||Z.call(e,c)}Xe(Co,{handleOptionMouseEnter:re,handleOptionClick:ie,valueSetRef:k,pendingTmNodeRef:w,nodePropsRef:ne(e,"nodeProps"),showCheckmarkRef:ne(e,"showCheckmark"),multipleRef:ne(e,"multiple"),valueRef:ne(e,"value"),renderLabelRef:ne(e,"renderLabel"),renderOptionRef:ne(e,"renderOption"),labelFieldRef:ne(e,"labelField"),valueFieldRef:ne(e,"valueField")}),Xe(Tt,s),He(()=>{const{value:c}=v;c&&c.sync()});const q=E(()=>{const{size:c}=e,{common:{cubicBezierEaseInOut:p},self:{height:Z,borderRadius:he,color:Ce,groupHeaderTextColor:fe,actionDividerColor:de,optionTextColorPressed:we,optionTextColor:be,optionTextColorDisabled:pe,optionTextColorActive:Be,optionOpacityDisabled:$e,optionCheckColor:ke,actionTextColor:Re,optionColorPending:_e,optionColorActive:Ee,loadingColor:Le,loadingSize:Pe,optionColorActivePending:Ie,[te("optionFontSize",c)]:ve,[te("optionHeight",c)]:u,[te("optionPadding",c)]:C}}=d.value;return{"--n-height":Z,"--n-action-divider-color":de,"--n-action-text-color":Re,"--n-bezier":p,"--n-border-radius":he,"--n-color":Ce,"--n-option-font-size":ve,"--n-group-header-text-color":fe,"--n-option-check-color":ke,"--n-option-color-pending":_e,"--n-option-color-active":Ee,"--n-option-color-active-pending":Ie,"--n-option-height":u,"--n-option-opacity-disabled":$e,"--n-option-text-color":be,"--n-option-text-color-active":Be,"--n-option-text-color-disabled":pe,"--n-option-text-color-pressed":we,"--n-option-padding":C,"--n-option-padding-left":Me(C,"left"),"--n-option-padding-right":Me(C,"right"),"--n-loading-color":Le,"--n-loading-size":Pe}}),{inlineThemeDisabled:G}=e,ae=G?eo("internal-select-menu",E(()=>e.size[0]),q,e):void 0,ce={selfRef:s,next:S,prev:A,getPendingTmNode:X};return Ho(s,e.onResize),Object.assign({mergedTheme:d,mergedClsPrefix:n,rtlEnabled:l,virtualListRef:r,scrollbarRef:v,itemSize:b,padding:T,flattenedNodes:m,empty:y,mergedRenderEmpty:F,virtualListContainer(){const{value:c}=r;return c==null?void 0:c.listElRef},virtualListContent(){const{value:c}=r;return c==null?void 0:c.itemsElRef},doScroll:N,handleFocusin:Y,handleFocusout:V,handleKeyUp:J,handleKeyDown:ee,handleMouseDown:h,handleVirtualListResize:K,handleVirtualListScroll:L,cssVars:G?void 0:q,themeClass:ae==null?void 0:ae.themeClass,onRender:ae==null?void 0:ae.onRender},ce)},render(){const{$slots:e,virtualScroll:n,clsPrefix:t,mergedTheme:i,themeClass:l,onRender:d}=this;return d==null||d(),a("div",{ref:"selfRef",tabindex:this.focusable?0:-1,class:[`${t}-base-select-menu`,`${t}-base-select-menu--${this.size}-size`,this.rtlEnabled&&`${t}-base-select-menu--rtl`,l,this.multiple&&`${t}-base-select-menu--multiple`],style:this.cssVars,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onKeyup:this.handleKeyUp,onKeydown:this.handleKeyDown,onMousedown:this.handleMouseDown,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},Ye(e.header,s=>s&&a("div",{class:`${t}-base-select-menu__header`,"data-header":!0,key:"header"},s)),this.loading?a("div",{class:`${t}-base-select-menu__loading`},a(Lo,{clsPrefix:t,strokeWidth:20})):this.empty?a("div",{class:`${t}-base-select-menu__empty`,"data-empty":!0},bo(e.empty,()=>{var s;return[((s=this.mergedRenderEmpty)===null||s===void 0?void 0:s.call(this))||a(qt,{theme:i.peers.Empty,themeOverrides:i.peerOverrides.Empty,size:this.size})]})):a(Rt,Object.assign({ref:"scrollbarRef",theme:i.peers.Scrollbar,themeOverrides:i.peerOverrides.Scrollbar,scrollable:this.scrollable,container:n?this.virtualListContainer:void 0,content:n?this.virtualListContent:void 0,onScroll:n?void 0:this.doScroll},this.scrollbarProps),{default:()=>n?a(Jt,{ref:"virtualListRef",class:`${t}-virtual-list`,items:this.flattenedNodes,itemSize:this.itemSize,showScrollbar:!1,paddingTop:this.padding.top,paddingBottom:this.padding.bottom,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemResizable:!0},{default:({item:s})=>s.isGroup?a(Io,{key:s.key,clsPrefix:t,tmNode:s}):s.ignored?null:a(Oo,{clsPrefix:t,key:s.key,tmNode:s})}):a("div",{class:`${t}-base-select-menu-option-wrapper`,style:{paddingTop:this.padding.top,paddingBottom:this.padding.bottom}},this.flattenedNodes.map(s=>s.isGroup?a(Io,{key:s.key,clsPrefix:t,tmNode:s}):a(Oo,{clsPrefix:t,key:s.key,tmNode:s})))}),Ye(e.action,s=>s&&[a("div",{class:`${t}-base-select-menu__action`,"data-action":!0,key:"action"},s),a(rn,{onFocus:this.onTabOut,key:"focus-detector"})]))}}),hn={closeIconSizeTiny:"12px",closeIconSizeSmall:"12px",closeIconSizeMedium:"14px",closeIconSizeLarge:"14px",closeSizeTiny:"16px",closeSizeSmall:"16px",closeSizeMedium:"18px",closeSizeLarge:"18px",padding:"0 7px",closeMargin:"0 0 0 4px"};function fn(e){const{textColor2:n,primaryColorHover:t,primaryColorPressed:i,primaryColor:l,infoColor:d,successColor:s,warningColor:r,errorColor:v,baseColor:m,borderColor:x,opacityDisabled:w,tagColor:I,closeIconColor:z,closeIconColorHover:g,closeIconColorPressed:b,borderRadiusSmall:T,fontSizeMini:k,fontSizeTiny:y,fontSizeSmall:F,fontSizeMedium:H,heightMini:N,heightTiny:L,heightSmall:K,heightMedium:X,closeColorHover:re,closeColorPressed:ie,buttonColor2Hover:J,buttonColor2Pressed:ee,fontWeightStrong:h}=e;return Object.assign(Object.assign({},hn),{closeBorderRadius:T,heightTiny:N,heightSmall:L,heightMedium:K,heightLarge:X,borderRadius:T,opacityDisabled:w,fontSizeTiny:k,fontSizeSmall:y,fontSizeMedium:F,fontSizeLarge:H,fontWeightStrong:h,textColorCheckable:n,textColorHoverCheckable:n,textColorPressedCheckable:n,textColorChecked:m,colorCheckable:"#0000",colorHoverCheckable:J,colorPressedCheckable:ee,colorChecked:l,colorCheckedHover:t,colorCheckedPressed:i,border:`1px solid ${x}`,textColor:n,color:I,colorBordered:"rgb(250, 250, 252)",closeIconColor:z,closeIconColorHover:g,closeIconColorPressed:b,closeColorHover:re,closeColorPressed:ie,borderPrimary:`1px solid ${D(l,{alpha:.3})}`,textColorPrimary:l,colorPrimary:D(l,{alpha:.12}),colorBorderedPrimary:D(l,{alpha:.1}),closeIconColorPrimary:l,closeIconColorHoverPrimary:l,closeIconColorPressedPrimary:l,closeColorHoverPrimary:D(l,{alpha:.12}),closeColorPressedPrimary:D(l,{alpha:.18}),borderInfo:`1px solid ${D(d,{alpha:.3})}`,textColorInfo:d,colorInfo:D(d,{alpha:.12}),colorBorderedInfo:D(d,{alpha:.1}),closeIconColorInfo:d,closeIconColorHoverInfo:d,closeIconColorPressedInfo:d,closeColorHoverInfo:D(d,{alpha:.12}),closeColorPressedInfo:D(d,{alpha:.18}),borderSuccess:`1px solid ${D(s,{alpha:.3})}`,textColorSuccess:s,colorSuccess:D(s,{alpha:.12}),colorBorderedSuccess:D(s,{alpha:.1}),closeIconColorSuccess:s,closeIconColorHoverSuccess:s,closeIconColorPressedSuccess:s,closeColorHoverSuccess:D(s,{alpha:.12}),closeColorPressedSuccess:D(s,{alpha:.18}),borderWarning:`1px solid ${D(r,{alpha:.35})}`,textColorWarning:r,colorWarning:D(r,{alpha:.15}),colorBorderedWarning:D(r,{alpha:.12}),closeIconColorWarning:r,closeIconColorHoverWarning:r,closeIconColorPressedWarning:r,closeColorHoverWarning:D(r,{alpha:.12}),closeColorPressedWarning:D(r,{alpha:.18}),borderError:`1px solid ${D(v,{alpha:.23})}`,textColorError:v,colorError:D(v,{alpha:.1}),colorBorderedError:D(v,{alpha:.08}),closeIconColorError:v,closeIconColorHoverError:v,closeIconColorPressedError:v,closeColorHoverError:D(v,{alpha:.12}),closeColorPressedError:D(v,{alpha:.18})})}const vn={common:Je,self:fn},gn={color:Object,type:{type:String,default:"default"},round:Boolean,size:String,closable:Boolean,disabled:{type:Boolean,default:void 0}},bn=W("tag",`
 --n-close-margin: var(--n-close-margin-top) var(--n-close-margin-right) var(--n-close-margin-bottom) var(--n-close-margin-left);
 white-space: nowrap;
 position: relative;
 box-sizing: border-box;
 cursor: default;
 display: inline-flex;
 align-items: center;
 flex-wrap: nowrap;
 padding: var(--n-padding);
 border-radius: var(--n-border-radius);
 color: var(--n-text-color);
 background-color: var(--n-color);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 line-height: 1;
 height: var(--n-height);
 font-size: var(--n-font-size);
`,[Q("strong",`
 font-weight: var(--n-font-weight-strong);
 `),_("border",`
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-border);
 transition: border-color .3s var(--n-bezier);
 `),_("icon",`
 display: flex;
 margin: 0 4px 0 0;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 font-size: var(--n-avatar-size-override);
 `),_("avatar",`
 display: flex;
 margin: 0 6px 0 0;
 `),_("close",`
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),Q("round",`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[_("icon",`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),_("avatar",`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),Q("closable",`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),Q("icon, avatar",[Q("round",`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),Q("disabled",`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),Q("checkable",`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[ze("disabled",[se("&:hover","background-color: var(--n-color-hover-checkable);",[ze("checked","color: var(--n-text-color-hover-checkable);")]),se("&:active","background-color: var(--n-color-pressed-checkable);",[ze("checked","color: var(--n-text-color-pressed-checkable);")])]),Q("checked",`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[ze("disabled",[se("&:hover","background-color: var(--n-color-checked-hover);"),se("&:active","background-color: var(--n-color-checked-pressed);")])])])]),pn=Object.assign(Object.assign(Object.assign({},Se.props),gn),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,triggerClickOnClose:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalCloseIsButtonTag:{type:Boolean,default:!0},onCheckedChange:Function}),mn=Pt("n-tag"),co=ue({name:"Tag",props:pn,slots:Object,setup(e){const n=O(null),{mergedBorderedRef:t,mergedClsPrefixRef:i,inlineThemeDisabled:l,mergedRtlRef:d,mergedComponentPropsRef:s}=Qe(e),r=E(()=>{var b,T;return e.size||((T=(b=s==null?void 0:s.value)===null||b===void 0?void 0:b.Tag)===null||T===void 0?void 0:T.size)||"medium"}),v=Se("Tag","-tag",bn,vn,e,i);Xe(mn,{roundRef:ne(e,"round")});function m(){if(!e.disabled&&e.checkable){const{checked:b,onCheckedChange:T,onUpdateChecked:k,"onUpdate:checked":y}=e;k&&k(!b),y&&y(!b),T&&T(!b)}}function x(b){if(e.triggerClickOnClose||b.stopPropagation(),!e.disabled){const{onClose:T}=e;T&&ge(T,b)}}const w={setTextContent(b){const{value:T}=n;T&&(T.textContent=b)}},I=xo("Tag",d,i),z=E(()=>{const{type:b,color:{color:T,textColor:k}={}}=e,y=r.value,{common:{cubicBezierEaseInOut:F},self:{padding:H,closeMargin:N,borderRadius:L,opacityDisabled:K,textColorCheckable:X,textColorHoverCheckable:re,textColorPressedCheckable:ie,textColorChecked:J,colorCheckable:ee,colorHoverCheckable:h,colorPressedCheckable:S,colorChecked:A,colorCheckedHover:j,colorCheckedPressed:U,closeBorderRadius:Y,fontWeightStrong:V,[te("colorBordered",b)]:q,[te("closeSize",y)]:G,[te("closeIconSize",y)]:ae,[te("fontSize",y)]:ce,[te("height",y)]:c,[te("color",b)]:p,[te("textColor",b)]:Z,[te("border",b)]:he,[te("closeIconColor",b)]:Ce,[te("closeIconColorHover",b)]:fe,[te("closeIconColorPressed",b)]:de,[te("closeColorHover",b)]:we,[te("closeColorPressed",b)]:be}}=v.value,pe=Me(N);return{"--n-font-weight-strong":V,"--n-avatar-size-override":`calc(${c} - 8px)`,"--n-bezier":F,"--n-border-radius":L,"--n-border":he,"--n-close-icon-size":ae,"--n-close-color-pressed":be,"--n-close-color-hover":we,"--n-close-border-radius":Y,"--n-close-icon-color":Ce,"--n-close-icon-color-hover":fe,"--n-close-icon-color-pressed":de,"--n-close-icon-color-disabled":Ce,"--n-close-margin-top":pe.top,"--n-close-margin-right":pe.right,"--n-close-margin-bottom":pe.bottom,"--n-close-margin-left":pe.left,"--n-close-size":G,"--n-color":T||(t.value?q:p),"--n-color-checkable":ee,"--n-color-checked":A,"--n-color-checked-hover":j,"--n-color-checked-pressed":U,"--n-color-hover-checkable":h,"--n-color-pressed-checkable":S,"--n-font-size":ce,"--n-height":c,"--n-opacity-disabled":K,"--n-padding":H,"--n-text-color":k||Z,"--n-text-color-checkable":X,"--n-text-color-checked":J,"--n-text-color-hover-checkable":re,"--n-text-color-pressed-checkable":ie}}),g=l?eo("tag",E(()=>{let b="";const{type:T,color:{color:k,textColor:y}={}}=e;return b+=T[0],b+=r.value[0],k&&(b+=`a${yo(k)}`),y&&(b+=`b${yo(y)}`),t.value&&(b+="c"),b}),z,e):void 0;return Object.assign(Object.assign({},w),{rtlEnabled:I,mergedClsPrefix:i,contentRef:n,mergedBordered:t,handleClick:m,handleCloseClick:x,cssVars:l?void 0:z,themeClass:g==null?void 0:g.themeClass,onRender:g==null?void 0:g.onRender})},render(){var e,n;const{mergedClsPrefix:t,rtlEnabled:i,closable:l,color:{borderColor:d}={},round:s,onRender:r,$slots:v}=this;r==null||r();const m=Ye(v.avatar,w=>w&&a("div",{class:`${t}-tag__avatar`},w)),x=Ye(v.icon,w=>w&&a("div",{class:`${t}-tag__icon`},w));return a("div",{class:[`${t}-tag`,this.themeClass,{[`${t}-tag--rtl`]:i,[`${t}-tag--strong`]:this.strong,[`${t}-tag--disabled`]:this.disabled,[`${t}-tag--checkable`]:this.checkable,[`${t}-tag--checked`]:this.checkable&&this.checked,[`${t}-tag--round`]:s,[`${t}-tag--avatar`]:m,[`${t}-tag--icon`]:x,[`${t}-tag--closable`]:l}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},x||m,a("span",{class:`${t}-tag__content`,ref:"contentRef"},(n=(e=this.$slots).default)===null||n===void 0?void 0:n.call(e)),!this.checkable&&l?a(Ft,{clsPrefix:t,class:`${t}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:s,isButtonTag:this.internalCloseIsButtonTag,absolute:!0}):null,!this.checkable&&this.mergedBordered?a("div",{class:`${t}-tag__border`,style:{borderColor:d}}):null)}}),Cn=ue({name:"InternalSelectionSuffix",props:{clsPrefix:{type:String,required:!0},showArrow:{type:Boolean,default:void 0},showClear:{type:Boolean,default:void 0},loading:{type:Boolean,default:!1},onClear:Function},setup(e,{slots:n}){return()=>{const{clsPrefix:t}=e;return a(Lo,{clsPrefix:t,class:`${t}-base-suffix`,strokeWidth:24,scale:.85,show:e.loading},{default:()=>e.showArrow?a(ln,{clsPrefix:t,show:e.showClear,onClear:e.onClear},{placeholder:()=>a(po,{clsPrefix:t,class:`${t}-base-suffix__arrow`},{default:()=>bo(n.default,()=>[a(on,null)])})}):null})}}}),xn={paddingSingle:"0 26px 0 12px",paddingMultiple:"3px 26px 0 12px",clearSize:"16px",arrowSize:"16px"};function wn(e){const{borderRadius:n,textColor2:t,textColorDisabled:i,inputColor:l,inputColorDisabled:d,primaryColor:s,primaryColorHover:r,warningColor:v,warningColorHover:m,errorColor:x,errorColorHover:w,borderColor:I,iconColor:z,iconColorDisabled:g,clearColor:b,clearColorHover:T,clearColorPressed:k,placeholderColor:y,placeholderColorDisabled:F,fontSizeTiny:H,fontSizeSmall:N,fontSizeMedium:L,fontSizeLarge:K,heightTiny:X,heightSmall:re,heightMedium:ie,heightLarge:J,fontWeight:ee}=e;return Object.assign(Object.assign({},xn),{fontSizeTiny:H,fontSizeSmall:N,fontSizeMedium:L,fontSizeLarge:K,heightTiny:X,heightSmall:re,heightMedium:ie,heightLarge:J,borderRadius:n,fontWeight:ee,textColor:t,textColorDisabled:i,placeholderColor:y,placeholderColorDisabled:F,color:l,colorDisabled:d,colorActive:l,border:`1px solid ${I}`,borderHover:`1px solid ${r}`,borderActive:`1px solid ${s}`,borderFocus:`1px solid ${r}`,boxShadowHover:"none",boxShadowActive:`0 0 0 2px ${D(s,{alpha:.2})}`,boxShadowFocus:`0 0 0 2px ${D(s,{alpha:.2})}`,caretColor:s,arrowColor:z,arrowColorDisabled:g,loadingColor:s,borderWarning:`1px solid ${v}`,borderHoverWarning:`1px solid ${m}`,borderActiveWarning:`1px solid ${v}`,borderFocusWarning:`1px solid ${m}`,boxShadowHoverWarning:"none",boxShadowActiveWarning:`0 0 0 2px ${D(v,{alpha:.2})}`,boxShadowFocusWarning:`0 0 0 2px ${D(v,{alpha:.2})}`,colorActiveWarning:l,caretColorWarning:v,borderError:`1px solid ${x}`,borderHoverError:`1px solid ${w}`,borderActiveError:`1px solid ${x}`,borderFocusError:`1px solid ${w}`,boxShadowHoverError:"none",boxShadowActiveError:`0 0 0 2px ${D(x,{alpha:.2})}`,boxShadowFocusError:`0 0 0 2px ${D(x,{alpha:.2})}`,colorActiveError:l,caretColorError:x,clearColor:b,clearColorHover:T,clearColorPressed:k})}const Do=mo({name:"InternalSelection",common:Je,peers:{Popover:It},self:wn}),yn=se([W("base-selection",`
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
 `,[W("base-loading",`
 color: var(--n-loading-color);
 `),W("base-selection-tags","min-height: var(--n-height);"),_("border, state-border",`
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
 `),_("state-border",`
 z-index: 1;
 border-color: #0000;
 `),W("base-suffix",`
 cursor: pointer;
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 right: 10px;
 `,[_("arrow",`
 font-size: var(--n-arrow-size);
 color: var(--n-arrow-color);
 transition: color .3s var(--n-bezier);
 `)]),W("base-selection-overlay",`
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
 `,[_("wrapper",`
 flex-basis: 0;
 flex-grow: 1;
 overflow: hidden;
 text-overflow: ellipsis;
 `)]),W("base-selection-placeholder",`
 color: var(--n-placeholder-color);
 `,[_("inner",`
 max-width: 100%;
 overflow: hidden;
 `)]),W("base-selection-tags",`
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
 `),W("base-selection-label",`
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
 `,[W("base-selection-input",`
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
 `,[_("content",`
 text-overflow: ellipsis;
 overflow: hidden;
 white-space: nowrap; 
 `)]),_("render-label",`
 color: var(--n-text-color);
 `)]),ze("disabled",[se("&:hover",[_("state-border",`
 box-shadow: var(--n-box-shadow-hover);
 border: var(--n-border-hover);
 `)]),Q("focus",[_("state-border",`
 box-shadow: var(--n-box-shadow-focus);
 border: var(--n-border-focus);
 `)]),Q("active",[_("state-border",`
 box-shadow: var(--n-box-shadow-active);
 border: var(--n-border-active);
 `),W("base-selection-label","background-color: var(--n-color-active);"),W("base-selection-tags","background-color: var(--n-color-active);")])]),Q("disabled","cursor: not-allowed;",[_("arrow",`
 color: var(--n-arrow-color-disabled);
 `),W("base-selection-label",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `,[W("base-selection-input",`
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 `),_("render-label",`
 color: var(--n-text-color-disabled);
 `)]),W("base-selection-tags",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `),W("base-selection-placeholder",`
 cursor: not-allowed;
 color: var(--n-placeholder-color-disabled);
 `)]),W("base-selection-input-tag",`
 height: calc(var(--n-height) - 6px);
 line-height: calc(var(--n-height) - 6px);
 outline: none;
 display: none;
 position: relative;
 margin-bottom: 3px;
 max-width: 100%;
 vertical-align: bottom;
 `,[_("input",`
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
 `),_("mirror",`
 position: absolute;
 left: 0;
 top: 0;
 white-space: pre;
 visibility: hidden;
 user-select: none;
 -webkit-user-select: none;
 opacity: 0;
 `)]),["warning","error"].map(e=>Q(`${e}-status`,[_("state-border",`border: var(--n-border-${e});`),ze("disabled",[se("&:hover",[_("state-border",`
 box-shadow: var(--n-box-shadow-hover-${e});
 border: var(--n-border-hover-${e});
 `)]),Q("active",[_("state-border",`
 box-shadow: var(--n-box-shadow-active-${e});
 border: var(--n-border-active-${e});
 `),W("base-selection-label",`background-color: var(--n-color-active-${e});`),W("base-selection-tags",`background-color: var(--n-color-active-${e});`)]),Q("focus",[_("state-border",`
 box-shadow: var(--n-box-shadow-focus-${e});
 border: var(--n-border-focus-${e});
 `)])])]))]),W("base-selection-popover",`
 margin-bottom: -3px;
 display: flex;
 flex-wrap: wrap;
 margin-right: -8px;
 `),W("base-selection-tag-wrapper",`
 max-width: 100%;
 display: inline-flex;
 padding: 0 7px 3px 0;
 `,[se("&:last-child","padding-right: 0;"),W("tag",`
 font-size: 14px;
 max-width: 100%;
 `,[_("content",`
 line-height: 1.25;
 text-overflow: ellipsis;
 overflow: hidden;
 `)])])]),Sn=ue({name:"InternalSelection",props:Object.assign(Object.assign({},Se.props),{clsPrefix:{type:String,required:!0},bordered:{type:Boolean,default:void 0},active:Boolean,pattern:{type:String,default:""},placeholder:String,selectedOption:{type:Object,default:null},selectedOptions:{type:Array,default:null},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},multiple:Boolean,filterable:Boolean,clearable:Boolean,disabled:Boolean,size:{type:String,default:"medium"},loading:Boolean,autofocus:Boolean,showArrow:{type:Boolean,default:!0},inputProps:Object,focused:Boolean,renderTag:Function,onKeydown:Function,onClick:Function,onBlur:Function,onFocus:Function,onDeleteOption:Function,maxTagCount:[String,Number],ellipsisTagPopoverProps:Object,onClear:Function,onPatternInput:Function,onPatternFocus:Function,onPatternBlur:Function,renderLabel:Function,status:String,inlineThemeDisabled:Boolean,ignoreComposition:{type:Boolean,default:!0},onResize:Function}),setup(e){const{mergedClsPrefixRef:n,mergedRtlRef:t}=Qe(e),i=xo("InternalSelection",t,n),l=O(null),d=O(null),s=O(null),r=O(null),v=O(null),m=O(null),x=O(null),w=O(null),I=O(null),z=O(null),g=O(!1),b=O(!1),T=O(!1),k=Se("InternalSelection","-internal-selection",yn,Do,e,ne(e,"clsPrefix")),y=E(()=>e.clearable&&!e.disabled&&(T.value||e.active)),F=E(()=>e.selectedOption?e.renderTag?e.renderTag({option:e.selectedOption,handleClose:()=>{}}):e.renderLabel?e.renderLabel(e.selectedOption,!0):Oe(e.selectedOption[e.labelField],e.selectedOption,!0):e.placeholder),H=E(()=>{const u=e.selectedOption;if(u)return u[e.labelField]}),N=E(()=>e.multiple?!!(Array.isArray(e.selectedOptions)&&e.selectedOptions.length):e.selectedOption!==null);function L(){var u;const{value:C}=l;if(C){const{value:oe}=d;oe&&(oe.style.width=`${C.offsetWidth}px`,e.maxTagCount!=="responsive"&&((u=I.value)===null||u===void 0||u.sync({showAllItemsBeforeCalculate:!1})))}}function K(){const{value:u}=z;u&&(u.style.display="none")}function X(){const{value:u}=z;u&&(u.style.display="inline-block")}Fe(ne(e,"active"),u=>{u||K()}),Fe(ne(e,"pattern"),()=>{e.multiple&&go(L)});function re(u){const{onFocus:C}=e;C&&C(u)}function ie(u){const{onBlur:C}=e;C&&C(u)}function J(u){const{onDeleteOption:C}=e;C&&C(u)}function ee(u){const{onClear:C}=e;C&&C(u)}function h(u){const{onPatternInput:C}=e;C&&C(u)}function S(u){var C;(!u.relatedTarget||!(!((C=s.value)===null||C===void 0)&&C.contains(u.relatedTarget)))&&re(u)}function A(u){var C;!((C=s.value)===null||C===void 0)&&C.contains(u.relatedTarget)||ie(u)}function j(u){ee(u)}function U(){T.value=!0}function Y(){T.value=!1}function V(u){!e.active||!e.filterable||u.target!==d.value&&u.preventDefault()}function q(u){J(u)}const G=O(!1);function ae(u){if(u.key==="Backspace"&&!G.value&&!e.pattern.length){const{selectedOptions:C}=e;C!=null&&C.length&&q(C[C.length-1])}}let ce=null;function c(u){const{value:C}=l;if(C){const oe=u.target.value;C.textContent=oe,L()}e.ignoreComposition&&G.value?ce=u:h(u)}function p(){G.value=!0}function Z(){G.value=!1,e.ignoreComposition&&h(ce),ce=null}function he(u){var C;b.value=!0,(C=e.onPatternFocus)===null||C===void 0||C.call(e,u)}function Ce(u){var C;b.value=!1,(C=e.onPatternBlur)===null||C===void 0||C.call(e,u)}function fe(){var u,C;if(e.filterable)b.value=!1,(u=m.value)===null||u===void 0||u.blur(),(C=d.value)===null||C===void 0||C.blur();else if(e.multiple){const{value:oe}=r;oe==null||oe.blur()}else{const{value:oe}=v;oe==null||oe.blur()}}function de(){var u,C,oe;e.filterable?(b.value=!1,(u=m.value)===null||u===void 0||u.focus()):e.multiple?(C=r.value)===null||C===void 0||C.focus():(oe=v.value)===null||oe===void 0||oe.focus()}function we(){const{value:u}=d;u&&(X(),u.focus())}function be(){const{value:u}=d;u&&u.blur()}function pe(u){const{value:C}=x;C&&C.setTextContent(`+${u}`)}function Be(){const{value:u}=w;return u}function $e(){return d.value}let ke=null;function Re(){ke!==null&&window.clearTimeout(ke)}function _e(){e.active||(Re(),ke=window.setTimeout(()=>{N.value&&(g.value=!0)},100))}function Ee(){Re()}function Le(u){u||(Re(),g.value=!1)}Fe(N,u=>{u||(g.value=!1)}),He(()=>{$t(()=>{const u=m.value;u&&(e.disabled?u.removeAttribute("tabindex"):u.tabIndex=b.value?-1:0)})}),Ho(s,e.onResize);const{inlineThemeDisabled:Pe}=e,Ie=E(()=>{const{size:u}=e,{common:{cubicBezierEaseInOut:C},self:{fontWeight:oe,borderRadius:oo,color:to,placeholderColor:no,textColor:Ne,paddingSingle:De,paddingMultiple:je,caretColor:lo,colorDisabled:ro,textColorDisabled:Ve,placeholderColorDisabled:ye,colorActive:o,boxShadowFocus:f,boxShadowActive:R,boxShadowHover:B,border:P,borderFocus:M,borderHover:$,borderActive:le,arrowColor:me,arrowColorDisabled:Vo,loadingColor:Uo,colorActiveWarning:Ko,boxShadowFocusWarning:qo,boxShadowActiveWarning:Go,boxShadowHoverWarning:Xo,borderWarning:Yo,borderFocusWarning:Zo,borderHoverWarning:Jo,borderActiveWarning:Qo,colorActiveError:et,boxShadowFocusError:ot,boxShadowActiveError:tt,boxShadowHoverError:nt,borderError:lt,borderFocusError:rt,borderHoverError:it,borderActiveError:at,clearColor:st,clearColorHover:ct,clearColorPressed:dt,clearSize:ut,arrowSize:ht,[te("height",u)]:ft,[te("fontSize",u)]:vt}}=k.value,Ue=Me(De),Ke=Me(je);return{"--n-bezier":C,"--n-border":P,"--n-border-active":le,"--n-border-focus":M,"--n-border-hover":$,"--n-border-radius":oo,"--n-box-shadow-active":R,"--n-box-shadow-focus":f,"--n-box-shadow-hover":B,"--n-caret-color":lo,"--n-color":to,"--n-color-active":o,"--n-color-disabled":ro,"--n-font-size":vt,"--n-height":ft,"--n-padding-single-top":Ue.top,"--n-padding-multiple-top":Ke.top,"--n-padding-single-right":Ue.right,"--n-padding-multiple-right":Ke.right,"--n-padding-single-left":Ue.left,"--n-padding-multiple-left":Ke.left,"--n-padding-single-bottom":Ue.bottom,"--n-padding-multiple-bottom":Ke.bottom,"--n-placeholder-color":no,"--n-placeholder-color-disabled":ye,"--n-text-color":Ne,"--n-text-color-disabled":Ve,"--n-arrow-color":me,"--n-arrow-color-disabled":Vo,"--n-loading-color":Uo,"--n-color-active-warning":Ko,"--n-box-shadow-focus-warning":qo,"--n-box-shadow-active-warning":Go,"--n-box-shadow-hover-warning":Xo,"--n-border-warning":Yo,"--n-border-focus-warning":Zo,"--n-border-hover-warning":Jo,"--n-border-active-warning":Qo,"--n-color-active-error":et,"--n-box-shadow-focus-error":ot,"--n-box-shadow-active-error":tt,"--n-box-shadow-hover-error":nt,"--n-border-error":lt,"--n-border-focus-error":rt,"--n-border-hover-error":it,"--n-border-active-error":at,"--n-clear-size":ut,"--n-clear-color":st,"--n-clear-color-hover":ct,"--n-clear-color-pressed":dt,"--n-arrow-size":ht,"--n-font-weight":oe}}),ve=Pe?eo("internal-selection",E(()=>e.size[0]),Ie,e):void 0;return{mergedTheme:k,mergedClearable:y,mergedClsPrefix:n,rtlEnabled:i,patternInputFocused:b,filterablePlaceholder:F,label:H,selected:N,showTagsPanel:g,isComposing:G,counterRef:x,counterWrapperRef:w,patternInputMirrorRef:l,patternInputRef:d,selfRef:s,multipleElRef:r,singleElRef:v,patternInputWrapperRef:m,overflowRef:I,inputTagElRef:z,handleMouseDown:V,handleFocusin:S,handleClear:j,handleMouseEnter:U,handleMouseLeave:Y,handleDeleteOption:q,handlePatternKeyDown:ae,handlePatternInputInput:c,handlePatternInputBlur:Ce,handlePatternInputFocus:he,handleMouseEnterCounter:_e,handleMouseLeaveCounter:Ee,handleFocusout:A,handleCompositionEnd:Z,handleCompositionStart:p,onPopoverUpdateShow:Le,focus:de,focusInput:we,blur:fe,blurInput:be,updateCounter:pe,getCounter:Be,getTail:$e,renderLabel:e.renderLabel,cssVars:Pe?void 0:Ie,themeClass:ve==null?void 0:ve.themeClass,onRender:ve==null?void 0:ve.onRender}},render(){const{status:e,multiple:n,size:t,disabled:i,filterable:l,maxTagCount:d,bordered:s,clsPrefix:r,ellipsisTagPopoverProps:v,onRender:m,renderTag:x,renderLabel:w}=this;m==null||m();const I=d==="responsive",z=typeof d=="number",g=I||z,b=a(Ot,null,{default:()=>a(Cn,{clsPrefix:r,loading:this.loading,showArrow:this.showArrow,showClear:this.mergedClearable&&this.selected,onClear:this.handleClear},{default:()=>{var k,y;return(y=(k=this.$slots).arrow)===null||y===void 0?void 0:y.call(k)}})});let T;if(n){const{labelField:k}=this,y=h=>a("div",{class:`${r}-base-selection-tag-wrapper`,key:h.value},x?x({option:h,handleClose:()=>{this.handleDeleteOption(h)}}):a(co,{size:t,closable:!h.disabled,disabled:i,onClose:()=>{this.handleDeleteOption(h)},internalCloseIsButtonTag:!1,internalCloseFocusable:!1},{default:()=>w?w(h,!0):Oe(h[k],h,!0)})),F=()=>(z?this.selectedOptions.slice(0,d):this.selectedOptions).map(y),H=l?a("div",{class:`${r}-base-selection-input-tag`,ref:"inputTagElRef",key:"__input-tag__"},a("input",Object.assign({},this.inputProps,{ref:"patternInputRef",tabindex:-1,disabled:i,value:this.pattern,autofocus:this.autofocus,class:`${r}-base-selection-input-tag__input`,onBlur:this.handlePatternInputBlur,onFocus:this.handlePatternInputFocus,onKeydown:this.handlePatternKeyDown,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),a("span",{ref:"patternInputMirrorRef",class:`${r}-base-selection-input-tag__mirror`},this.pattern)):null,N=I?()=>a("div",{class:`${r}-base-selection-tag-wrapper`,ref:"counterWrapperRef"},a(co,{size:t,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,onMouseleave:this.handleMouseLeaveCounter,disabled:i})):void 0;let L;if(z){const h=this.selectedOptions.length-d;h>0&&(L=a("div",{class:`${r}-base-selection-tag-wrapper`,key:"__counter__"},a(co,{size:t,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,disabled:i},{default:()=>`+${h}`})))}const K=I?l?a(Fo,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,getTail:this.getTail,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:F,counter:N,tail:()=>H}):a(Fo,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:F,counter:N}):z&&L?F().concat(L):F(),X=g?()=>a("div",{class:`${r}-base-selection-popover`},I?F():this.selectedOptions.map(y)):void 0,re=g?Object.assign({show:this.showTagsPanel,trigger:"hover",overlap:!0,placement:"top",width:"trigger",onUpdateShow:this.onPopoverUpdateShow,theme:this.mergedTheme.peers.Popover,themeOverrides:this.mergedTheme.peerOverrides.Popover},v):null,J=(this.selected?!1:this.active?!this.pattern&&!this.isComposing:!0)?a("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`},a("div",{class:`${r}-base-selection-placeholder__inner`},this.placeholder)):null,ee=l?a("div",{ref:"patternInputWrapperRef",class:`${r}-base-selection-tags`},K,I?null:H,b):a("div",{ref:"multipleElRef",class:`${r}-base-selection-tags`,tabindex:i?void 0:0},K,b);T=a(Mt,null,g?a(Bt,Object.assign({},re,{scrollable:!0,style:"max-height: calc(var(--v-target-height) * 6.6);"}),{trigger:()=>ee,default:X}):ee,J)}else if(l){const k=this.pattern||this.isComposing,y=this.active?!k:!this.selected,F=this.active?!1:this.selected;T=a("div",{ref:"patternInputWrapperRef",class:`${r}-base-selection-label`,title:this.patternInputFocused?void 0:Po(this.label)},a("input",Object.assign({},this.inputProps,{ref:"patternInputRef",class:`${r}-base-selection-input`,value:this.active?this.pattern:"",placeholder:"",readonly:i,disabled:i,tabindex:-1,autofocus:this.autofocus,onFocus:this.handlePatternInputFocus,onBlur:this.handlePatternInputBlur,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),F?a("div",{class:`${r}-base-selection-label__render-label ${r}-base-selection-overlay`,key:"input"},a("div",{class:`${r}-base-selection-overlay__wrapper`},x?x({option:this.selectedOption,handleClose:()=>{}}):w?w(this.selectedOption,!0):Oe(this.label,this.selectedOption,!0))):null,y?a("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`,key:"placeholder"},a("div",{class:`${r}-base-selection-overlay__wrapper`},this.filterablePlaceholder)):null,b)}else T=a("div",{ref:"singleElRef",class:`${r}-base-selection-label`,tabindex:this.disabled?void 0:0},this.label!==void 0?a("div",{class:`${r}-base-selection-input`,title:Po(this.label),key:"input"},a("div",{class:`${r}-base-selection-input__content`},x?x({option:this.selectedOption,handleClose:()=>{}}):w?w(this.selectedOption,!0):Oe(this.label,this.selectedOption,!0))):a("div",{class:`${r}-base-selection-placeholder ${r}-base-selection-overlay`,key:"placeholder"},a("div",{class:`${r}-base-selection-placeholder__inner`},this.placeholder)),b);return a("div",{ref:"selfRef",class:[`${r}-base-selection`,this.rtlEnabled&&`${r}-base-selection--rtl`,this.themeClass,e&&`${r}-base-selection--${e}-status`,{[`${r}-base-selection--active`]:this.active,[`${r}-base-selection--selected`]:this.selected||this.active&&this.pattern,[`${r}-base-selection--disabled`]:this.disabled,[`${r}-base-selection--multiple`]:this.multiple,[`${r}-base-selection--focus`]:this.focused}],style:this.cssVars,onClick:this.onClick,onMouseenter:this.handleMouseEnter,onMouseleave:this.handleMouseLeave,onKeydown:this.onKeydown,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onMousedown:this.handleMouseDown},T,s?a("div",{class:`${r}-base-selection__border`}):null,s?a("div",{class:`${r}-base-selection__state-border`}):null)}});function Ze(e){return e.type==="group"}function jo(e){return e.type==="ignored"}function uo(e,n){try{return!!(1+n.toString().toLowerCase().indexOf(e.trim().toLowerCase()))}catch{return!1}}function kn(e,n){return{getIsGroup:Ze,getIgnored:jo,getKey(i){return Ze(i)?i.name||i.key||"key-required":i[e]},getChildren(i){return i[n]}}}function Rn(e,n,t,i){if(!n)return e;function l(d){if(!Array.isArray(d))return[];const s=[];for(const r of d)if(Ze(r)){const v=l(r[i]);v.length&&s.push(Object.assign({},r,{[i]:v}))}else{if(jo(r))continue;n(t,r)&&s.push(r)}return s}return l(e)}function zn(e,n,t){const i=new Map;return e.forEach(l=>{Ze(l)?l[t].forEach(d=>{i.set(d[n],d)}):i.set(l[n],l)}),i}function Tn(e){const{boxShadow2:n}=e;return{menuBoxShadow:n}}const Fn=mo({name:"Select",common:Je,peers:{InternalSelection:Do,InternalSelectMenu:No},self:Tn}),Pn=se([W("select",`
 z-index: auto;
 outline: none;
 width: 100%;
 position: relative;
 font-weight: var(--n-font-weight);
 `),W("select-menu",`
 margin: 4px 0;
 box-shadow: var(--n-menu-box-shadow);
 `,[Eo({originalTransition:"background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)"})])]),In=Object.assign(Object.assign({},Se.props),{to:fo.propTo,bordered:{type:Boolean,default:void 0},clearable:Boolean,clearCreatedOptionsOnClear:{type:Boolean,default:!0},clearFilterAfterSelect:{type:Boolean,default:!0},options:{type:Array,default:()=>[]},defaultValue:{type:[String,Number,Array],default:null},keyboard:{type:Boolean,default:!0},value:[String,Number,Array],placeholder:String,menuProps:Object,multiple:Boolean,size:String,menuSize:{type:String},filterable:Boolean,disabled:{type:Boolean,default:void 0},remote:Boolean,loading:Boolean,filter:Function,placement:{type:String,default:"bottom-start"},widthMode:{type:String,default:"trigger"},tag:Boolean,onCreate:Function,fallbackOption:{type:[Function,Boolean],default:void 0},show:{type:Boolean,default:void 0},showArrow:{type:Boolean,default:!0},maxTagCount:[Number,String],ellipsisTagPopoverProps:Object,consistentMenuWidth:{type:Boolean,default:!0},virtualScroll:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},childrenField:{type:String,default:"children"},renderLabel:Function,renderOption:Function,renderTag:Function,"onUpdate:value":[Function,Array],inputProps:Object,nodeProps:Function,ignoreComposition:{type:Boolean,default:!0},showOnFocus:Boolean,onUpdateValue:[Function,Array],onBlur:[Function,Array],onClear:[Function,Array],onFocus:[Function,Array],onScroll:[Function,Array],onSearch:[Function,Array],onUpdateShow:[Function,Array],"onUpdate:show":[Function,Array],displayDirective:{type:String,default:"show"},resetMenuOnOptionsChange:{type:Boolean,default:!0},status:String,showCheckmark:{type:Boolean,default:!0},scrollbarProps:Object,onChange:[Function,Array],items:Array}),Bn=ue({name:"Select",props:In,slots:Object,setup(e){const{mergedClsPrefixRef:n,mergedBorderedRef:t,namespaceRef:i,inlineThemeDisabled:l,mergedComponentPropsRef:d}=Qe(e),s=Se("Select","-select",Pn,Fn,e,n),r=O(e.defaultValue),v=ne(e,"value"),m=ko(v,r),x=O(!1),w=O(""),I=Vt(e,["items","options"]),z=O([]),g=O([]),b=E(()=>g.value.concat(z.value).concat(I.value)),T=E(()=>{const{filter:o}=e;if(o)return o;const{labelField:f,valueField:R}=e;return(B,P)=>{if(!P)return!1;const M=P[f];if(typeof M=="string")return uo(B,M);const $=P[R];return typeof $=="string"?uo(B,$):typeof $=="number"?uo(B,String($)):!1}}),k=E(()=>{if(e.remote)return I.value;{const{value:o}=b,{value:f}=w;return!f.length||!e.filterable?o:Rn(o,T.value,f,e.childrenField)}}),y=E(()=>{const{valueField:o,childrenField:f}=e,R=kn(o,f);return Ut(k.value,R)}),F=E(()=>zn(b.value,e.valueField,e.childrenField)),H=O(!1),N=ko(ne(e,"show"),H),L=O(null),K=O(null),X=O(null),{localeRef:re}=Gt("Select"),ie=E(()=>{var o;return(o=e.placeholder)!==null&&o!==void 0?o:re.value.placeholder}),J=[],ee=O(new Map),h=E(()=>{const{fallbackOption:o}=e;if(o===void 0){const{labelField:f,valueField:R}=e;return B=>({[f]:String(B),[R]:B})}return o===!1?!1:f=>Object.assign(o(f),{value:f})});function S(o){const f=e.remote,{value:R}=ee,{value:B}=F,{value:P}=h,M=[];return o.forEach($=>{if(B.has($))M.push(B.get($));else if(f&&R.has($))M.push(R.get($));else if(P){const le=P($);le&&M.push(le)}}),M}const A=E(()=>{if(e.multiple){const{value:o}=m;return Array.isArray(o)?S(o):[]}return null}),j=E(()=>{const{value:o}=m;return!e.multiple&&!Array.isArray(o)?o===null?null:S([o])[0]||null:null}),U=Ht(e,{mergedSize:o=>{var f,R;const{size:B}=e;if(B)return B;const{mergedSize:P}=o||{};if(P!=null&&P.value)return P.value;const M=(R=(f=d==null?void 0:d.value)===null||f===void 0?void 0:f.Select)===null||R===void 0?void 0:R.size;return M||"medium"}}),{mergedSizeRef:Y,mergedDisabledRef:V,mergedStatusRef:q}=U;function G(o,f){const{onChange:R,"onUpdate:value":B,onUpdateValue:P}=e,{nTriggerFormChange:M,nTriggerFormInput:$}=U;R&&ge(R,o,f),P&&ge(P,o,f),B&&ge(B,o,f),r.value=o,M(),$()}function ae(o){const{onBlur:f}=e,{nTriggerFormBlur:R}=U;f&&ge(f,o),R()}function ce(){const{onClear:o}=e;o&&ge(o)}function c(o){const{onFocus:f,showOnFocus:R}=e,{nTriggerFormFocus:B}=U;f&&ge(f,o),B(),R&&fe()}function p(o){const{onSearch:f}=e;f&&ge(f,o)}function Z(o){const{onScroll:f}=e;f&&ge(f,o)}function he(){var o;const{remote:f,multiple:R}=e;if(f){const{value:B}=ee;if(R){const{valueField:P}=e;(o=A.value)===null||o===void 0||o.forEach(M=>{B.set(M[P],M)})}else{const P=j.value;P&&B.set(P[e.valueField],P)}}}function Ce(o){const{onUpdateShow:f,"onUpdate:show":R}=e;f&&ge(f,o),R&&ge(R,o),H.value=o}function fe(){V.value||(Ce(!0),H.value=!0,e.filterable&&je())}function de(){Ce(!1)}function we(){w.value="",g.value=J}const be=O(!1);function pe(){e.filterable&&(be.value=!0)}function Be(){e.filterable&&(be.value=!1,N.value||we())}function $e(){V.value||(N.value?e.filterable?je():de():fe())}function ke(o){var f,R;!((R=(f=X.value)===null||f===void 0?void 0:f.selfRef)===null||R===void 0)&&R.contains(o.relatedTarget)||(x.value=!1,ae(o),de())}function Re(o){c(o),x.value=!0}function _e(){x.value=!0}function Ee(o){var f;!((f=L.value)===null||f===void 0)&&f.$el.contains(o.relatedTarget)||(x.value=!1,ae(o),de())}function Le(){var o;(o=L.value)===null||o===void 0||o.focus(),de()}function Pe(o){var f;N.value&&(!((f=L.value)===null||f===void 0)&&f.$el.contains(Dt(o))||de())}function Ie(o){if(!Array.isArray(o))return[];if(h.value)return Array.from(o);{const{remote:f}=e,{value:R}=F;if(f){const{value:B}=ee;return o.filter(P=>R.has(P)||B.has(P))}else return o.filter(B=>R.has(B))}}function ve(o){u(o.rawNode)}function u(o){if(V.value)return;const{tag:f,remote:R,clearFilterAfterSelect:B,valueField:P}=e;if(f&&!R){const{value:M}=g,$=M[0]||null;if($){const le=z.value;le.length?le.push($):z.value=[$],g.value=J}}if(R&&ee.value.set(o[P],o),e.multiple){const M=Ie(m.value),$=M.findIndex(le=>le===o[P]);if(~$){if(M.splice($,1),f&&!R){const le=C(o[P]);~le&&(z.value.splice(le,1),B&&(w.value=""))}}else M.push(o[P]),B&&(w.value="");G(M,S(M))}else{if(f&&!R){const M=C(o[P]);~M?z.value=[z.value[M]]:z.value=J}De(),de(),G(o[P],o)}}function C(o){return z.value.findIndex(R=>R[e.valueField]===o)}function oe(o){N.value||fe();const{value:f}=o.target;w.value=f;const{tag:R,remote:B}=e;if(p(f),R&&!B){if(!f){g.value=J;return}const{onCreate:P}=e,M=P?P(f):{[e.labelField]:f,[e.valueField]:f},{valueField:$,labelField:le}=e;I.value.some(me=>me[$]===M[$]||me[le]===M[le])||z.value.some(me=>me[$]===M[$]||me[le]===M[le])?g.value=J:g.value=[M]}}function oo(o){o.stopPropagation();const{multiple:f,tag:R,remote:B,clearCreatedOptionsOnClear:P}=e;!f&&e.filterable&&de(),R&&!B&&P&&(z.value=J),ce(),f?G([],[]):G(null,null)}function to(o){!We(o,"action")&&!We(o,"empty")&&!We(o,"header")&&o.preventDefault()}function no(o){Z(o)}function Ne(o){var f,R,B,P,M;if(!e.keyboard){o.preventDefault();return}switch(o.key){case" ":if(e.filterable)break;o.preventDefault();case"Enter":if(!(!((f=L.value)===null||f===void 0)&&f.isComposing)){if(N.value){const $=(R=X.value)===null||R===void 0?void 0:R.getPendingTmNode();$?ve($):e.filterable||(de(),De())}else if(fe(),e.tag&&be.value){const $=g.value[0];if($){const le=$[e.valueField],{value:me}=m;e.multiple&&Array.isArray(me)&&me.includes(le)||u($)}}}o.preventDefault();break;case"ArrowUp":if(o.preventDefault(),e.loading)return;N.value&&((B=X.value)===null||B===void 0||B.prev());break;case"ArrowDown":if(o.preventDefault(),e.loading)return;N.value?(P=X.value)===null||P===void 0||P.next():fe();break;case"Escape":N.value&&(jt(o),de()),(M=L.value)===null||M===void 0||M.focus();break}}function De(){var o;(o=L.value)===null||o===void 0||o.focus()}function je(){var o;(o=L.value)===null||o===void 0||o.focusInput()}function lo(){var o;N.value&&((o=K.value)===null||o===void 0||o.syncPosition())}he(),Fe(ne(e,"options"),he);const ro={focus:()=>{var o;(o=L.value)===null||o===void 0||o.focus()},focusInput:()=>{var o;(o=L.value)===null||o===void 0||o.focusInput()},blur:()=>{var o;(o=L.value)===null||o===void 0||o.blur()},blurInput:()=>{var o;(o=L.value)===null||o===void 0||o.blurInput()}},Ve=E(()=>{const{self:{menuBoxShadow:o}}=s.value;return{"--n-menu-box-shadow":o}}),ye=l?eo("select",void 0,Ve,e):void 0;return Object.assign(Object.assign({},ro),{mergedStatus:q,mergedClsPrefix:n,mergedBordered:t,namespace:i,treeMate:y,isMounted:Nt(),triggerRef:L,menuRef:X,pattern:w,uncontrolledShow:H,mergedShow:N,adjustedTo:fo(e),uncontrolledValue:r,mergedValue:m,followerRef:K,localizedPlaceholder:ie,selectedOption:j,selectedOptions:A,mergedSize:Y,mergedDisabled:V,focused:x,activeWithoutMenuOpen:be,inlineThemeDisabled:l,onTriggerInputFocus:pe,onTriggerInputBlur:Be,handleTriggerOrMenuResize:lo,handleMenuFocus:_e,handleMenuBlur:Ee,handleMenuTabOut:Le,handleTriggerClick:$e,handleToggle:ve,handleDeleteOption:u,handlePatternInput:oe,handleClear:oo,handleTriggerBlur:ke,handleTriggerFocus:Re,handleKeydown:Ne,handleMenuAfterLeave:we,handleMenuClickOutside:Pe,handleMenuScroll:no,handleMenuKeydown:Ne,handleMenuMousedown:to,mergedTheme:s,cssVars:l?void 0:Ve,themeClass:ye==null?void 0:ye.themeClass,onRender:ye==null?void 0:ye.onRender})},render(){return a("div",{class:`${this.mergedClsPrefix}-select`},a(_t,null,{default:()=>[a(Et,null,{default:()=>a(Sn,{ref:"triggerRef",inlineThemeDisabled:this.inlineThemeDisabled,status:this.mergedStatus,inputProps:this.inputProps,clsPrefix:this.mergedClsPrefix,showArrow:this.showArrow,maxTagCount:this.maxTagCount,ellipsisTagPopoverProps:this.ellipsisTagPopoverProps,bordered:this.mergedBordered,active:this.activeWithoutMenuOpen||this.mergedShow,pattern:this.pattern,placeholder:this.localizedPlaceholder,selectedOption:this.selectedOption,selectedOptions:this.selectedOptions,multiple:this.multiple,renderTag:this.renderTag,renderLabel:this.renderLabel,filterable:this.filterable,clearable:this.clearable,disabled:this.mergedDisabled,size:this.mergedSize,theme:this.mergedTheme.peers.InternalSelection,labelField:this.labelField,valueField:this.valueField,themeOverrides:this.mergedTheme.peerOverrides.InternalSelection,loading:this.loading,focused:this.focused,onClick:this.handleTriggerClick,onDeleteOption:this.handleDeleteOption,onPatternInput:this.handlePatternInput,onClear:this.handleClear,onBlur:this.handleTriggerBlur,onFocus:this.handleTriggerFocus,onKeydown:this.handleKeydown,onPatternBlur:this.onTriggerInputBlur,onPatternFocus:this.onTriggerInputFocus,onResize:this.handleTriggerOrMenuResize,ignoreComposition:this.ignoreComposition},{arrow:()=>{var e,n;return[(n=(e=this.$slots).arrow)===null||n===void 0?void 0:n.call(e)]}})}),a(Lt,{ref:"followerRef",show:this.mergedShow,to:this.adjustedTo,teleportDisabled:this.adjustedTo===fo.tdkey,containerClass:this.namespace,width:this.consistentMenuWidth?"target":void 0,minWidth:"target",placement:this.placement},{default:()=>a(_o,{name:"fade-in-scale-up-transition",appear:this.isMounted,onAfterLeave:this.handleMenuAfterLeave},{default:()=>{var e,n,t;return this.mergedShow||this.displayDirective==="show"?((e=this.onRender)===null||e===void 0||e.call(this),At(a(un,Object.assign({},this.menuProps,{ref:"menuRef",onResize:this.handleTriggerOrMenuResize,inlineThemeDisabled:this.inlineThemeDisabled,virtualScroll:this.consistentMenuWidth&&this.virtualScroll,class:[`${this.mergedClsPrefix}-select-menu`,this.themeClass,(n=this.menuProps)===null||n===void 0?void 0:n.class],clsPrefix:this.mergedClsPrefix,focusable:!0,labelField:this.labelField,valueField:this.valueField,autoPending:!0,nodeProps:this.nodeProps,theme:this.mergedTheme.peers.InternalSelectMenu,themeOverrides:this.mergedTheme.peerOverrides.InternalSelectMenu,treeMate:this.treeMate,multiple:this.multiple,size:this.menuSize,renderOption:this.renderOption,renderLabel:this.renderLabel,value:this.mergedValue,style:[(t=this.menuProps)===null||t===void 0?void 0:t.style,this.cssVars],onToggle:this.handleToggle,onScroll:this.handleMenuScroll,onFocus:this.handleMenuFocus,onBlur:this.handleMenuBlur,onKeydown:this.handleMenuKeydown,onTabOut:this.handleMenuTabOut,onMousedown:this.handleMenuMousedown,show:this.mergedShow,showCheckmark:this.showCheckmark,resetMenuOnOptionsChange:this.resetMenuOnOptionsChange,scrollbarProps:this.scrollbarProps}),{empty:()=>{var i,l;return[(l=(i=this.$slots).empty)===null||l===void 0?void 0:l.call(i)]},header:()=>{var i,l;return[(l=(i=this.$slots).header)===null||l===void 0?void 0:l.call(i)]},action:()=>{var i,l;return[(l=(i=this.$slots).action)===null||l===void 0?void 0:l.call(i)]}}),this.displayDirective==="show"?[[Wt,this.mergedShow],[So,this.handleMenuClickOutside,void 0,{capture:!0}]]:[[So,this.handleMenuClickOutside,void 0,{capture:!0}]])):null}})})]}))}});export{on as C,rn as F,Bn as N,Jt as V,co as a,un as b,kn as c,ln as d,Cn as e,No as i,so as m,Fn as s};
