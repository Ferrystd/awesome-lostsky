import{d as ye,X as so,N as u,ax as Jo,aO as en,a1 as Ke,L as $,aP as on,aQ as nn,aR as oo,p as ze,aS as xo,O as co,Q as tn,R as qe,aT as Te,V as wo,aU as uo,aF as no,ah as ln,a5 as yo,ac as I,af as _,ad as V,ab as oe,ag as Oe,ae as So,Z as Ve,aV as rn,Y as an,a9 as sn,aj as Ge,aE as ho,al as we,an as Ye,k as H,ap as Ee,ar as X,aW as dn,aX as cn,av as K,aY as Me,as as io,aZ as un,T as B,a_ as hn,aq as se,a$ as fo,U as fn,ay as vn,b0 as gn,F as bn,aA as pn,at as mn,a2 as Cn,a3 as xn,a4 as wn,ai as ao,a6 as yn,b1 as Sn,a8 as vo,am as go,ak as kn,ao as Pn,a7 as On,b2 as zn,az as Fn}from"./index-HCbVrWQN.js";import{N as Rn,u as Tn}from"./Suffix-B2a7KZV4.js";import{V as Mn,F as In,m as $n}from"./FocusDetector-CnljpYPJ.js";import{e as Bn,N as _n}from"./Empty-DbpTLjtU.js";const pe="v-hidden",An=nn("[v-hidden]",{display:"none!important"}),bo=ye({name:"Overflow",props:{getCounter:Function,getTail:Function,updateCounter:Function,onUpdateCount:Function,onUpdateOverflow:Function},setup(e,{slots:r}){const t=$(null),d=$(null);function s(a){const{value:n}=t,{getCounter:m,getTail:z}=e;let w;if(m!==void 0?w=m():w=d.value,!n||!w)return;w.hasAttribute(pe)&&w.removeAttribute(pe);const{children:x}=n;if(a.showAllItemsBeforeCalculate)for(const O of x)O.hasAttribute(pe)&&O.removeAttribute(pe);const M=n.offsetWidth,P=[],h=r.tail?z==null?void 0:z():null;let f=h?h.offsetWidth:0,S=!1;const y=n.children.length-(r.tail?1:0);for(let O=0;O<y-1;++O){if(O<0)continue;const N=x[O];if(S){N.hasAttribute(pe)||N.setAttribute(pe,"");continue}else N.hasAttribute(pe)&&N.removeAttribute(pe);const E=N.offsetWidth;if(f+=E,P[O]=E,f>M){const{updateCounter:A}=e;for(let W=O;W>=0;--W){const j=y-1-W;A!==void 0?A(j):w.textContent=`${j}`;const Q=w.offsetWidth;if(f-=P[W],f+Q<=M||W===0){S=!0,O=W-1,h&&(O===-1?(h.style.maxWidth=`${M-Q}px`,h.style.boxSizing="border-box"):h.style.maxWidth="");const{onUpdateCount:Z}=e;Z&&Z(j);break}}}}const{onUpdateOverflow:p}=e;S?p!==void 0&&p(!0):(p!==void 0&&p(!1),w.setAttribute(pe,""))}const v=on();return An.mount({id:"vueuc/overflow",head:!0,anchorMetaName:en,ssr:v}),Ke(()=>s({showAllItemsBeforeCalculate:!1})),{selfRef:t,counterRef:d,sync:s}},render(){const{$slots:e}=this;return so(()=>this.sync({showAllItemsBeforeCalculate:!1})),u("div",{class:"v-overflow",ref:"selfRef"},[Jo(e,"default"),e.counter?e.counter():u("span",{style:{display:"inline-block"},ref:"counterRef"}),e.tail?e.tail():null])}});function ko(e,r){r&&(Ke(()=>{const{value:t}=e;t&&oo.registerHandler(t,r)}),ze(e,(t,d)=>{d&&oo.unregisterHandler(d)},{deep:!1}),xo(()=>{const{value:t}=e;t&&oo.unregisterHandler(t)}))}function po(e){switch(typeof e){case"string":return e||void 0;case"number":return String(e);default:return}}function to(e){const r=e.filter(t=>t!==void 0);if(r.length!==0)return r.length===1?r[0]:t=>{e.forEach(d=>{d&&d(t)})}}const En=ye({name:"Checkmark",render(){return u("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16"},u("g",{fill:"none"},u("path",{d:"M14.046 3.486a.75.75 0 0 1-.032 1.06l-7.93 7.474a.85.85 0 0 1-1.188-.022l-2.68-2.72a.75.75 0 1 1 1.068-1.053l2.234 2.267l7.468-7.038a.75.75 0 0 1 1.06.032z",fill:"currentColor"})))}}),Hn={height:"calc(var(--n-option-height) * 7.6)",paddingTiny:"4px 0",paddingSmall:"4px 0",paddingMedium:"4px 0",paddingLarge:"4px 0",paddingHuge:"4px 0",optionPaddingTiny:"0 12px",optionPaddingSmall:"0 12px",optionPaddingMedium:"0 12px",optionPaddingLarge:"0 12px",optionPaddingHuge:"0 12px",loadingSize:"18px"};function Nn(e){const{borderRadius:r,popoverColor:t,textColor3:d,dividerColor:s,textColor2:v,primaryColorPressed:a,textColorDisabled:n,primaryColor:m,opacityDisabled:z,hoverColor:w,fontSizeTiny:x,fontSizeSmall:M,fontSizeMedium:P,fontSizeLarge:h,fontSizeHuge:f,heightTiny:S,heightSmall:y,heightMedium:p,heightLarge:O,heightHuge:N}=e;return Object.assign(Object.assign({},Hn),{optionFontSizeTiny:x,optionFontSizeSmall:M,optionFontSizeMedium:P,optionFontSizeLarge:h,optionFontSizeHuge:f,optionHeightTiny:S,optionHeightSmall:y,optionHeightMedium:p,optionHeightLarge:O,optionHeightHuge:N,borderRadius:r,color:t,groupHeaderTextColor:d,actionDividerColor:s,optionTextColor:v,optionTextColorPressed:a,optionTextColorDisabled:n,optionTextColorActive:m,optionOpacityDisabled:z,optionCheckColor:m,optionColorPending:w,optionColorActive:"rgba(0, 0, 0, 0)",optionColorActivePending:w,actionTextColor:v,loadingColor:m})}const Po=co({name:"InternalSelectMenu",common:qe,peers:{Scrollbar:tn,Empty:Bn},self:Nn}),mo=ye({name:"NBaseSelectGroupHeader",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(){const{renderLabelRef:e,renderOptionRef:r,labelFieldRef:t,nodePropsRef:d}=wo(uo);return{labelField:t,nodeProps:d,renderLabel:e,renderOption:r}},render(){const{clsPrefix:e,renderLabel:r,renderOption:t,nodeProps:d,tmNode:{rawNode:s}}=this,v=d==null?void 0:d(s),a=r?r(s,!1):Te(s[this.labelField],s,!1),n=u("div",Object.assign({},v,{class:[`${e}-base-select-group-header`,v==null?void 0:v.class]}),a);return s.render?s.render({node:n,option:s}):t?t({node:n,option:s,selected:!1}):n}});function Dn(e,r){return u(yo,{name:"fade-in-scale-up-transition"},{default:()=>e?u(ln,{clsPrefix:r,class:`${r}-base-select-option__check`},{default:()=>u(En)}):null})}const Co=ye({name:"NBaseSelectOption",props:{clsPrefix:{type:String,required:!0},tmNode:{type:Object,required:!0}},setup(e){const{valueRef:r,pendingTmNodeRef:t,multipleRef:d,valueSetRef:s,renderLabelRef:v,renderOptionRef:a,labelFieldRef:n,valueFieldRef:m,showCheckmarkRef:z,nodePropsRef:w,handleOptionClick:x,handleOptionMouseEnter:M}=wo(uo),P=no(()=>{const{value:y}=t;return y?e.tmNode.key===y.key:!1});function h(y){const{tmNode:p}=e;p.disabled||x(y,p)}function f(y){const{tmNode:p}=e;p.disabled||M(y,p)}function S(y){const{tmNode:p}=e,{value:O}=P;p.disabled||O||M(y,p)}return{multiple:d,isGrouped:no(()=>{const{tmNode:y}=e,{parent:p}=y;return p&&p.rawNode.type==="group"}),showCheckmark:z,nodeProps:w,isPending:P,isSelected:no(()=>{const{value:y}=r,{value:p}=d;if(y===null)return!1;const O=e.tmNode.rawNode[m.value];if(p){const{value:N}=s;return N.has(O)}else return y===O}),labelField:n,renderLabel:v,renderOption:a,handleMouseMove:S,handleMouseEnter:f,handleClick:h}},render(){const{clsPrefix:e,tmNode:{rawNode:r},isSelected:t,isPending:d,isGrouped:s,showCheckmark:v,nodeProps:a,renderOption:n,renderLabel:m,handleClick:z,handleMouseEnter:w,handleMouseMove:x}=this,M=Dn(t,e),P=m?[m(r,t),v&&M]:[Te(r[this.labelField],r,t),v&&M],h=a==null?void 0:a(r),f=u("div",Object.assign({},h,{class:[`${e}-base-select-option`,r.class,h==null?void 0:h.class,{[`${e}-base-select-option--disabled`]:r.disabled,[`${e}-base-select-option--selected`]:t,[`${e}-base-select-option--grouped`]:s,[`${e}-base-select-option--pending`]:d,[`${e}-base-select-option--show-checkmark`]:v}],style:[(h==null?void 0:h.style)||"",r.style||""],onClick:to([z,h==null?void 0:h.onClick]),onMouseenter:to([w,h==null?void 0:h.onMouseenter]),onMousemove:to([x,h==null?void 0:h.onMousemove])}),u("div",{class:`${e}-base-select-option__content`},P));return r.render?r.render({node:f,option:r,selected:t}):n?n({node:f,option:r,selected:t}):f}}),Ln=I("base-select-menu",`
 line-height: 1.5;
 outline: none;
 z-index: 0;
 position: relative;
 border-radius: var(--n-border-radius);
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-color);
`,[I("scrollbar",`
 max-height: var(--n-height);
 `),I("virtual-list",`
 max-height: var(--n-height);
 `),I("base-select-option",`
 min-height: var(--n-option-height);
 font-size: var(--n-option-font-size);
 display: flex;
 align-items: center;
 `,[_("content",`
 z-index: 1;
 white-space: nowrap;
 text-overflow: ellipsis;
 overflow: hidden;
 `)]),I("base-select-group-header",`
 min-height: var(--n-option-height);
 font-size: .93em;
 display: flex;
 align-items: center;
 `),I("base-select-menu-option-wrapper",`
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
 `),I("base-select-group-header",`
 position: relative;
 cursor: default;
 padding: var(--n-option-padding);
 color: var(--n-group-header-text-color);
 `),I("base-select-option",`
 cursor: pointer;
 position: relative;
 padding: var(--n-option-padding);
 transition:
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 box-sizing: border-box;
 color: var(--n-option-text-color);
 opacity: 1;
 `,[V("show-checkmark",`
 padding-right: calc(var(--n-option-padding-right) + 20px);
 `),oe("&::before",`
 content: "";
 position: absolute;
 left: 4px;
 right: 4px;
 top: 0;
 bottom: 0;
 border-radius: var(--n-border-radius);
 transition: background-color .3s var(--n-bezier);
 `),oe("&:active",`
 color: var(--n-option-text-color-pressed);
 `),V("grouped",`
 padding-left: calc(var(--n-option-padding-left) * 1.5);
 `),V("pending",[oe("&::before",`
 background-color: var(--n-option-color-pending);
 `)]),V("selected",`
 color: var(--n-option-text-color-active);
 `,[oe("&::before",`
 background-color: var(--n-option-color-active);
 `),V("pending",[oe("&::before",`
 background-color: var(--n-option-color-active-pending);
 `)])]),V("disabled",`
 cursor: not-allowed;
 `,[Oe("selected",`
 color: var(--n-option-text-color-disabled);
 `),V("selected",`
 opacity: var(--n-option-opacity-disabled);
 `)]),_("check",`
 font-size: 16px;
 position: absolute;
 right: calc(var(--n-option-padding-right) - 4px);
 top: calc(50% - 7px);
 color: var(--n-option-check-color);
 transition: color .3s var(--n-bezier);
 `,[So({enterScale:"0.5"})])])]),Wn=ye({name:"InternalSelectMenu",props:Object.assign(Object.assign({},we.props),{clsPrefix:{type:String,required:!0},scrollable:{type:Boolean,default:!0},treeMate:{type:Object,required:!0},multiple:Boolean,size:{type:String,default:"medium"},value:{type:[String,Number,Array],default:null},autoPending:Boolean,virtualScroll:{type:Boolean,default:!0},show:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},loading:Boolean,focusable:Boolean,renderLabel:Function,renderOption:Function,nodeProps:Function,showCheckmark:{type:Boolean,default:!0},onMousedown:Function,onScroll:Function,onFocus:Function,onBlur:Function,onKeyup:Function,onKeydown:Function,onTabOut:Function,onMouseenter:Function,onMouseleave:Function,onResize:Function,resetMenuOnOptionsChange:{type:Boolean,default:!0},inlineThemeDisabled:Boolean,scrollbarProps:Object,onToggle:Function}),setup(e){const{mergedClsPrefixRef:r,mergedRtlRef:t,mergedComponentPropsRef:d}=Ge(e),s=ho("InternalSelectMenu",t,r),v=we("InternalSelectMenu","-internal-select-menu",Ln,Po,e,X(e,"clsPrefix")),a=$(null),n=$(null),m=$(null),z=H(()=>e.treeMate.getFlattenedNodes()),w=H(()=>dn(z.value)),x=$(null);function M(){const{treeMate:i}=e;let g=null;const{value:L}=e;L===null?g=i.getFirstAvailableNode():(e.multiple?g=i.getNode((L||[])[(L||[]).length-1]):g=i.getNode(L),(!g||g.disabled)&&(g=i.getFirstAvailableNode())),te(g||null)}function P(){const{value:i}=x;i&&!e.treeMate.getNode(i.key)&&(x.value=null)}let h;ze(()=>e.show,i=>{i?h=ze(()=>e.treeMate,()=>{e.resetMenuOnOptionsChange?(e.autoPending?M():P(),so(re)):P()},{immediate:!0}):h==null||h()},{immediate:!0}),xo(()=>{h==null||h()});const f=H(()=>cn(v.value.self[K("optionHeight",e.size)])),S=H(()=>Me(v.value.self[K("padding",e.size)])),y=H(()=>e.multiple&&Array.isArray(e.value)?new Set(e.value):new Set),p=H(()=>{const i=z.value;return i&&i.length===0}),O=H(()=>{var i,g;return(g=(i=d==null?void 0:d.value)===null||i===void 0?void 0:i.Select)===null||g===void 0?void 0:g.renderEmpty});function N(i){const{onToggle:g}=e;g&&g(i)}function E(i){const{onScroll:g}=e;g&&g(i)}function A(i){var g;(g=m.value)===null||g===void 0||g.sync(),E(i)}function W(){var i;(i=m.value)===null||i===void 0||i.sync()}function j(){const{value:i}=x;return i||null}function Q(i,g){g.disabled||te(g,!1)}function Z(i,g){g.disabled||N(g)}function G(i){var g;Ee(i,"action")||(g=e.onKeyup)===null||g===void 0||g.call(e,i)}function Y(i){var g;Ee(i,"action")||(g=e.onKeydown)===null||g===void 0||g.call(e,i)}function D(i){var g;(g=e.onMousedown)===null||g===void 0||g.call(e,i),!e.focusable&&i.preventDefault()}function fe(){const{value:i}=x;i&&te(i.getNext({loop:!0}),!0)}function me(){const{value:i}=x;i&&te(i.getPrev({loop:!0}),!0)}function te(i,g=!1){x.value=i,g&&re()}function re(){var i,g;const L=x.value;if(!L)return;const le=w.value(L.key);le!==null&&(e.virtualScroll?(i=n.value)===null||i===void 0||i.scrollTo({index:le}):(g=m.value)===null||g===void 0||g.scrollTo({index:le,elSize:f.value}))}function Se(i){var g,L;!((g=a.value)===null||g===void 0)&&g.contains(i.target)&&((L=e.onFocus)===null||L===void 0||L.call(e,i))}function de(i){var g,L;!((g=a.value)===null||g===void 0)&&g.contains(i.relatedTarget)||(L=e.onBlur)===null||L===void 0||L.call(e,i)}io(uo,{handleOptionMouseEnter:Q,handleOptionClick:Z,valueSetRef:y,pendingTmNodeRef:x,nodePropsRef:X(e,"nodeProps"),showCheckmarkRef:X(e,"showCheckmark"),multipleRef:X(e,"multiple"),valueRef:X(e,"value"),renderLabelRef:X(e,"renderLabel"),renderOptionRef:X(e,"renderOption"),labelFieldRef:X(e,"labelField"),valueFieldRef:X(e,"valueField")}),io(un,a),Ke(()=>{const{value:i}=m;i&&i.sync()});const ve=H(()=>{const{size:i}=e,{common:{cubicBezierEaseInOut:g},self:{height:L,borderRadius:le,color:be,groupHeaderTextColor:ie,actionDividerColor:ee,optionTextColorPressed:Ce,optionTextColor:ce,optionTextColorDisabled:ue,optionTextColorActive:Ie,optionOpacityDisabled:$e,optionCheckColor:ke,actionTextColor:Pe,optionColorPending:Be,optionColorActive:_e,loadingColor:Ae,loadingSize:Fe,optionColorActivePending:Re,[K("optionFontSize",i)]:ae,[K("optionHeight",i)]:l,[K("optionPadding",i)]:b}}=v.value;return{"--n-height":L,"--n-action-divider-color":ee,"--n-action-text-color":Pe,"--n-bezier":g,"--n-border-radius":le,"--n-color":be,"--n-option-font-size":ae,"--n-group-header-text-color":ie,"--n-option-check-color":ke,"--n-option-color-pending":Be,"--n-option-color-active":_e,"--n-option-color-active-pending":Re,"--n-option-height":l,"--n-option-opacity-disabled":$e,"--n-option-text-color":ce,"--n-option-text-color-active":Ie,"--n-option-text-color-disabled":ue,"--n-option-text-color-pressed":Ce,"--n-option-padding":b,"--n-option-padding-left":Me(b,"left"),"--n-option-padding-right":Me(b,"right"),"--n-loading-color":Ae,"--n-loading-size":Fe}}),{inlineThemeDisabled:J}=e,ne=J?Ye("internal-select-menu",H(()=>e.size[0]),ve,e):void 0,ge={selfRef:a,next:fe,prev:me,getPendingTmNode:j};return ko(a,e.onResize),Object.assign({mergedTheme:v,mergedClsPrefix:r,rtlEnabled:s,virtualListRef:n,scrollbarRef:m,itemSize:f,padding:S,flattenedNodes:z,empty:p,mergedRenderEmpty:O,virtualListContainer(){const{value:i}=n;return i==null?void 0:i.listElRef},virtualListContent(){const{value:i}=n;return i==null?void 0:i.itemsElRef},doScroll:E,handleFocusin:Se,handleFocusout:de,handleKeyUp:G,handleKeyDown:Y,handleMouseDown:D,handleVirtualListResize:W,handleVirtualListScroll:A,cssVars:J?void 0:ve,themeClass:ne==null?void 0:ne.themeClass,onRender:ne==null?void 0:ne.onRender},ge)},render(){const{$slots:e,virtualScroll:r,clsPrefix:t,mergedTheme:d,themeClass:s,onRender:v}=this;return v==null||v(),u("div",{ref:"selfRef",tabindex:this.focusable?0:-1,class:[`${t}-base-select-menu`,`${t}-base-select-menu--${this.size}-size`,this.rtlEnabled&&`${t}-base-select-menu--rtl`,s,this.multiple&&`${t}-base-select-menu--multiple`],style:this.cssVars,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onKeyup:this.handleKeyUp,onKeydown:this.handleKeyDown,onMousedown:this.handleMouseDown,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},Ve(e.header,a=>a&&u("div",{class:`${t}-base-select-menu__header`,"data-header":!0,key:"header"},a)),this.loading?u("div",{class:`${t}-base-select-menu__loading`},u(rn,{clsPrefix:t,strokeWidth:20})):this.empty?u("div",{class:`${t}-base-select-menu__empty`,"data-empty":!0},sn(e.empty,()=>{var a;return[((a=this.mergedRenderEmpty)===null||a===void 0?void 0:a.call(this))||u(_n,{theme:d.peers.Empty,themeOverrides:d.peerOverrides.Empty,size:this.size})]})):u(an,Object.assign({ref:"scrollbarRef",theme:d.peers.Scrollbar,themeOverrides:d.peerOverrides.Scrollbar,scrollable:this.scrollable,container:r?this.virtualListContainer:void 0,content:r?this.virtualListContent:void 0,onScroll:r?void 0:this.doScroll},this.scrollbarProps),{default:()=>r?u(Mn,{ref:"virtualListRef",class:`${t}-virtual-list`,items:this.flattenedNodes,itemSize:this.itemSize,showScrollbar:!1,paddingTop:this.padding.top,paddingBottom:this.padding.bottom,onResize:this.handleVirtualListResize,onScroll:this.handleVirtualListScroll,itemResizable:!0},{default:({item:a})=>a.isGroup?u(mo,{key:a.key,clsPrefix:t,tmNode:a}):a.ignored?null:u(Co,{clsPrefix:t,key:a.key,tmNode:a})}):u("div",{class:`${t}-base-select-menu-option-wrapper`,style:{paddingTop:this.padding.top,paddingBottom:this.padding.bottom}},this.flattenedNodes.map(a=>a.isGroup?u(mo,{key:a.key,clsPrefix:t,tmNode:a}):u(Co,{clsPrefix:t,key:a.key,tmNode:a})))}),Ve(e.action,a=>a&&[u("div",{class:`${t}-base-select-menu__action`,"data-action":!0,key:"action"},a),u(In,{onFocus:this.onTabOut,key:"focus-detector"})]))}}),jn={closeIconSizeTiny:"12px",closeIconSizeSmall:"12px",closeIconSizeMedium:"14px",closeIconSizeLarge:"14px",closeSizeTiny:"16px",closeSizeSmall:"16px",closeSizeMedium:"18px",closeSizeLarge:"18px",padding:"0 7px",closeMargin:"0 0 0 4px"};function Vn(e){const{textColor2:r,primaryColorHover:t,primaryColorPressed:d,primaryColor:s,infoColor:v,successColor:a,warningColor:n,errorColor:m,baseColor:z,borderColor:w,opacityDisabled:x,tagColor:M,closeIconColor:P,closeIconColorHover:h,closeIconColorPressed:f,borderRadiusSmall:S,fontSizeMini:y,fontSizeTiny:p,fontSizeSmall:O,fontSizeMedium:N,heightMini:E,heightTiny:A,heightSmall:W,heightMedium:j,closeColorHover:Q,closeColorPressed:Z,buttonColor2Hover:G,buttonColor2Pressed:Y,fontWeightStrong:D}=e;return Object.assign(Object.assign({},jn),{closeBorderRadius:S,heightTiny:E,heightSmall:A,heightMedium:W,heightLarge:j,borderRadius:S,opacityDisabled:x,fontSizeTiny:y,fontSizeSmall:p,fontSizeMedium:O,fontSizeLarge:N,fontWeightStrong:D,textColorCheckable:r,textColorHoverCheckable:r,textColorPressedCheckable:r,textColorChecked:z,colorCheckable:"#0000",colorHoverCheckable:G,colorPressedCheckable:Y,colorChecked:s,colorCheckedHover:t,colorCheckedPressed:d,border:`1px solid ${w}`,textColor:r,color:M,colorBordered:"rgb(250, 250, 252)",closeIconColor:P,closeIconColorHover:h,closeIconColorPressed:f,closeColorHover:Q,closeColorPressed:Z,borderPrimary:`1px solid ${B(s,{alpha:.3})}`,textColorPrimary:s,colorPrimary:B(s,{alpha:.12}),colorBorderedPrimary:B(s,{alpha:.1}),closeIconColorPrimary:s,closeIconColorHoverPrimary:s,closeIconColorPressedPrimary:s,closeColorHoverPrimary:B(s,{alpha:.12}),closeColorPressedPrimary:B(s,{alpha:.18}),borderInfo:`1px solid ${B(v,{alpha:.3})}`,textColorInfo:v,colorInfo:B(v,{alpha:.12}),colorBorderedInfo:B(v,{alpha:.1}),closeIconColorInfo:v,closeIconColorHoverInfo:v,closeIconColorPressedInfo:v,closeColorHoverInfo:B(v,{alpha:.12}),closeColorPressedInfo:B(v,{alpha:.18}),borderSuccess:`1px solid ${B(a,{alpha:.3})}`,textColorSuccess:a,colorSuccess:B(a,{alpha:.12}),colorBorderedSuccess:B(a,{alpha:.1}),closeIconColorSuccess:a,closeIconColorHoverSuccess:a,closeIconColorPressedSuccess:a,closeColorHoverSuccess:B(a,{alpha:.12}),closeColorPressedSuccess:B(a,{alpha:.18}),borderWarning:`1px solid ${B(n,{alpha:.35})}`,textColorWarning:n,colorWarning:B(n,{alpha:.15}),colorBorderedWarning:B(n,{alpha:.12}),closeIconColorWarning:n,closeIconColorHoverWarning:n,closeIconColorPressedWarning:n,closeColorHoverWarning:B(n,{alpha:.12}),closeColorPressedWarning:B(n,{alpha:.18}),borderError:`1px solid ${B(m,{alpha:.23})}`,textColorError:m,colorError:B(m,{alpha:.1}),colorBorderedError:B(m,{alpha:.08}),closeIconColorError:m,closeIconColorHoverError:m,closeIconColorPressedError:m,closeColorHoverError:B(m,{alpha:.12}),closeColorPressedError:B(m,{alpha:.18})})}const Un={common:qe,self:Vn},Kn={color:Object,type:{type:String,default:"default"},round:Boolean,size:String,closable:Boolean,disabled:{type:Boolean,default:void 0}},qn=I("tag",`
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
`,[V("strong",`
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
 `),V("round",`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[_("icon",`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),_("avatar",`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),V("closable",`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),V("icon, avatar",[V("round",`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),V("disabled",`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),V("checkable",`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[Oe("disabled",[oe("&:hover","background-color: var(--n-color-hover-checkable);",[Oe("checked","color: var(--n-text-color-hover-checkable);")]),oe("&:active","background-color: var(--n-color-pressed-checkable);",[Oe("checked","color: var(--n-text-color-pressed-checkable);")])]),V("checked",`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[Oe("disabled",[oe("&:hover","background-color: var(--n-color-checked-hover);"),oe("&:active","background-color: var(--n-color-checked-pressed);")])])])]),Gn=Object.assign(Object.assign(Object.assign({},we.props),Kn),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,triggerClickOnClose:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalCloseIsButtonTag:{type:Boolean,default:!0},onCheckedChange:Function}),Yn=fn("n-tag"),lo=ye({name:"Tag",props:Gn,slots:Object,setup(e){const r=$(null),{mergedBorderedRef:t,mergedClsPrefixRef:d,inlineThemeDisabled:s,mergedRtlRef:v,mergedComponentPropsRef:a}=Ge(e),n=H(()=>{var f,S;return e.size||((S=(f=a==null?void 0:a.value)===null||f===void 0?void 0:f.Tag)===null||S===void 0?void 0:S.size)||"medium"}),m=we("Tag","-tag",qn,Un,e,d);io(Yn,{roundRef:X(e,"round")});function z(){if(!e.disabled&&e.checkable){const{checked:f,onCheckedChange:S,onUpdateChecked:y,"onUpdate:checked":p}=e;y&&y(!f),p&&p(!f),S&&S(!f)}}function w(f){if(e.triggerClickOnClose||f.stopPropagation(),!e.disabled){const{onClose:S}=e;S&&se(S,f)}}const x={setTextContent(f){const{value:S}=r;S&&(S.textContent=f)}},M=ho("Tag",v,d),P=H(()=>{const{type:f,color:{color:S,textColor:y}={}}=e,p=n.value,{common:{cubicBezierEaseInOut:O},self:{padding:N,closeMargin:E,borderRadius:A,opacityDisabled:W,textColorCheckable:j,textColorHoverCheckable:Q,textColorPressedCheckable:Z,textColorChecked:G,colorCheckable:Y,colorHoverCheckable:D,colorPressedCheckable:fe,colorChecked:me,colorCheckedHover:te,colorCheckedPressed:re,closeBorderRadius:Se,fontWeightStrong:de,[K("colorBordered",f)]:ve,[K("closeSize",p)]:J,[K("closeIconSize",p)]:ne,[K("fontSize",p)]:ge,[K("height",p)]:i,[K("color",f)]:g,[K("textColor",f)]:L,[K("border",f)]:le,[K("closeIconColor",f)]:be,[K("closeIconColorHover",f)]:ie,[K("closeIconColorPressed",f)]:ee,[K("closeColorHover",f)]:Ce,[K("closeColorPressed",f)]:ce}}=m.value,ue=Me(E);return{"--n-font-weight-strong":de,"--n-avatar-size-override":`calc(${i} - 8px)`,"--n-bezier":O,"--n-border-radius":A,"--n-border":le,"--n-close-icon-size":ne,"--n-close-color-pressed":ce,"--n-close-color-hover":Ce,"--n-close-border-radius":Se,"--n-close-icon-color":be,"--n-close-icon-color-hover":ie,"--n-close-icon-color-pressed":ee,"--n-close-icon-color-disabled":be,"--n-close-margin-top":ue.top,"--n-close-margin-right":ue.right,"--n-close-margin-bottom":ue.bottom,"--n-close-margin-left":ue.left,"--n-close-size":J,"--n-color":S||(t.value?ve:g),"--n-color-checkable":Y,"--n-color-checked":me,"--n-color-checked-hover":te,"--n-color-checked-pressed":re,"--n-color-hover-checkable":D,"--n-color-pressed-checkable":fe,"--n-font-size":ge,"--n-height":i,"--n-opacity-disabled":W,"--n-padding":N,"--n-text-color":y||L,"--n-text-color-checkable":j,"--n-text-color-checked":G,"--n-text-color-hover-checkable":Q,"--n-text-color-pressed-checkable":Z}}),h=s?Ye("tag",H(()=>{let f="";const{type:S,color:{color:y,textColor:p}={}}=e;return f+=S[0],f+=n.value[0],y&&(f+=`a${fo(y)}`),p&&(f+=`b${fo(p)}`),t.value&&(f+="c"),f}),P,e):void 0;return Object.assign(Object.assign({},x),{rtlEnabled:M,mergedClsPrefix:d,contentRef:r,mergedBordered:t,handleClick:z,handleCloseClick:w,cssVars:s?void 0:P,themeClass:h==null?void 0:h.themeClass,onRender:h==null?void 0:h.onRender})},render(){var e,r;const{mergedClsPrefix:t,rtlEnabled:d,closable:s,color:{borderColor:v}={},round:a,onRender:n,$slots:m}=this;n==null||n();const z=Ve(m.avatar,x=>x&&u("div",{class:`${t}-tag__avatar`},x)),w=Ve(m.icon,x=>x&&u("div",{class:`${t}-tag__icon`},x));return u("div",{class:[`${t}-tag`,this.themeClass,{[`${t}-tag--rtl`]:d,[`${t}-tag--strong`]:this.strong,[`${t}-tag--disabled`]:this.disabled,[`${t}-tag--checkable`]:this.checkable,[`${t}-tag--checked`]:this.checkable&&this.checked,[`${t}-tag--round`]:a,[`${t}-tag--avatar`]:z,[`${t}-tag--icon`]:w,[`${t}-tag--closable`]:s}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},w||z,u("span",{class:`${t}-tag__content`,ref:"contentRef"},(r=(e=this.$slots).default)===null||r===void 0?void 0:r.call(e)),!this.checkable&&s?u(hn,{clsPrefix:t,class:`${t}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:a,isButtonTag:this.internalCloseIsButtonTag,absolute:!0}):null,!this.checkable&&this.mergedBordered?u("div",{class:`${t}-tag__border`,style:{borderColor:v}}):null)}}),Qn={paddingSingle:"0 26px 0 12px",paddingMultiple:"3px 26px 0 12px",clearSize:"16px",arrowSize:"16px"};function Xn(e){const{borderRadius:r,textColor2:t,textColorDisabled:d,inputColor:s,inputColorDisabled:v,primaryColor:a,primaryColorHover:n,warningColor:m,warningColorHover:z,errorColor:w,errorColorHover:x,borderColor:M,iconColor:P,iconColorDisabled:h,clearColor:f,clearColorHover:S,clearColorPressed:y,placeholderColor:p,placeholderColorDisabled:O,fontSizeTiny:N,fontSizeSmall:E,fontSizeMedium:A,fontSizeLarge:W,heightTiny:j,heightSmall:Q,heightMedium:Z,heightLarge:G,fontWeight:Y}=e;return Object.assign(Object.assign({},Qn),{fontSizeTiny:N,fontSizeSmall:E,fontSizeMedium:A,fontSizeLarge:W,heightTiny:j,heightSmall:Q,heightMedium:Z,heightLarge:G,borderRadius:r,fontWeight:Y,textColor:t,textColorDisabled:d,placeholderColor:p,placeholderColorDisabled:O,color:s,colorDisabled:v,colorActive:s,border:`1px solid ${M}`,borderHover:`1px solid ${n}`,borderActive:`1px solid ${a}`,borderFocus:`1px solid ${n}`,boxShadowHover:"none",boxShadowActive:`0 0 0 2px ${B(a,{alpha:.2})}`,boxShadowFocus:`0 0 0 2px ${B(a,{alpha:.2})}`,caretColor:a,arrowColor:P,arrowColorDisabled:h,loadingColor:a,borderWarning:`1px solid ${m}`,borderHoverWarning:`1px solid ${z}`,borderActiveWarning:`1px solid ${m}`,borderFocusWarning:`1px solid ${z}`,boxShadowHoverWarning:"none",boxShadowActiveWarning:`0 0 0 2px ${B(m,{alpha:.2})}`,boxShadowFocusWarning:`0 0 0 2px ${B(m,{alpha:.2})}`,colorActiveWarning:s,caretColorWarning:m,borderError:`1px solid ${w}`,borderHoverError:`1px solid ${x}`,borderActiveError:`1px solid ${w}`,borderFocusError:`1px solid ${x}`,boxShadowHoverError:"none",boxShadowActiveError:`0 0 0 2px ${B(w,{alpha:.2})}`,boxShadowFocusError:`0 0 0 2px ${B(w,{alpha:.2})}`,colorActiveError:s,caretColorError:w,clearColor:f,clearColorHover:S,clearColorPressed:y})}const Oo=co({name:"InternalSelection",common:qe,peers:{Popover:vn},self:Xn}),Zn=oe([I("base-selection",`
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
 `,[I("base-loading",`
 color: var(--n-loading-color);
 `),I("base-selection-tags","min-height: var(--n-height);"),_("border, state-border",`
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
 `),I("base-suffix",`
 cursor: pointer;
 position: absolute;
 top: 50%;
 transform: translateY(-50%);
 right: 10px;
 `,[_("arrow",`
 font-size: var(--n-arrow-size);
 color: var(--n-arrow-color);
 transition: color .3s var(--n-bezier);
 `)]),I("base-selection-overlay",`
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
 `)]),I("base-selection-placeholder",`
 color: var(--n-placeholder-color);
 `,[_("inner",`
 max-width: 100%;
 overflow: hidden;
 `)]),I("base-selection-tags",`
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
 `),I("base-selection-label",`
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
 `,[I("base-selection-input",`
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
 `)]),Oe("disabled",[oe("&:hover",[_("state-border",`
 box-shadow: var(--n-box-shadow-hover);
 border: var(--n-border-hover);
 `)]),V("focus",[_("state-border",`
 box-shadow: var(--n-box-shadow-focus);
 border: var(--n-border-focus);
 `)]),V("active",[_("state-border",`
 box-shadow: var(--n-box-shadow-active);
 border: var(--n-border-active);
 `),I("base-selection-label","background-color: var(--n-color-active);"),I("base-selection-tags","background-color: var(--n-color-active);")])]),V("disabled","cursor: not-allowed;",[_("arrow",`
 color: var(--n-arrow-color-disabled);
 `),I("base-selection-label",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `,[I("base-selection-input",`
 cursor: not-allowed;
 color: var(--n-text-color-disabled);
 `),_("render-label",`
 color: var(--n-text-color-disabled);
 `)]),I("base-selection-tags",`
 cursor: not-allowed;
 background-color: var(--n-color-disabled);
 `),I("base-selection-placeholder",`
 cursor: not-allowed;
 color: var(--n-placeholder-color-disabled);
 `)]),I("base-selection-input-tag",`
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
 `)]),["warning","error"].map(e=>V(`${e}-status`,[_("state-border",`border: var(--n-border-${e});`),Oe("disabled",[oe("&:hover",[_("state-border",`
 box-shadow: var(--n-box-shadow-hover-${e});
 border: var(--n-border-hover-${e});
 `)]),V("active",[_("state-border",`
 box-shadow: var(--n-box-shadow-active-${e});
 border: var(--n-border-active-${e});
 `),I("base-selection-label",`background-color: var(--n-color-active-${e});`),I("base-selection-tags",`background-color: var(--n-color-active-${e});`)]),V("focus",[_("state-border",`
 box-shadow: var(--n-box-shadow-focus-${e});
 border: var(--n-border-focus-${e});
 `)])])]))]),I("base-selection-popover",`
 margin-bottom: -3px;
 display: flex;
 flex-wrap: wrap;
 margin-right: -8px;
 `),I("base-selection-tag-wrapper",`
 max-width: 100%;
 display: inline-flex;
 padding: 0 7px 3px 0;
 `,[oe("&:last-child","padding-right: 0;"),I("tag",`
 font-size: 14px;
 max-width: 100%;
 `,[_("content",`
 line-height: 1.25;
 text-overflow: ellipsis;
 overflow: hidden;
 `)])])]),Jn=ye({name:"InternalSelection",props:Object.assign(Object.assign({},we.props),{clsPrefix:{type:String,required:!0},bordered:{type:Boolean,default:void 0},active:Boolean,pattern:{type:String,default:""},placeholder:String,selectedOption:{type:Object,default:null},selectedOptions:{type:Array,default:null},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},multiple:Boolean,filterable:Boolean,clearable:Boolean,disabled:Boolean,size:{type:String,default:"medium"},loading:Boolean,autofocus:Boolean,showArrow:{type:Boolean,default:!0},inputProps:Object,focused:Boolean,renderTag:Function,onKeydown:Function,onClick:Function,onBlur:Function,onFocus:Function,onDeleteOption:Function,maxTagCount:[String,Number],ellipsisTagPopoverProps:Object,onClear:Function,onPatternInput:Function,onPatternFocus:Function,onPatternBlur:Function,renderLabel:Function,status:String,inlineThemeDisabled:Boolean,ignoreComposition:{type:Boolean,default:!0},onResize:Function}),setup(e){const{mergedClsPrefixRef:r,mergedRtlRef:t}=Ge(e),d=ho("InternalSelection",t,r),s=$(null),v=$(null),a=$(null),n=$(null),m=$(null),z=$(null),w=$(null),x=$(null),M=$(null),P=$(null),h=$(!1),f=$(!1),S=$(!1),y=we("InternalSelection","-internal-selection",Zn,Oo,e,X(e,"clsPrefix")),p=H(()=>e.clearable&&!e.disabled&&(S.value||e.active)),O=H(()=>e.selectedOption?e.renderTag?e.renderTag({option:e.selectedOption,handleClose:()=>{}}):e.renderLabel?e.renderLabel(e.selectedOption,!0):Te(e.selectedOption[e.labelField],e.selectedOption,!0):e.placeholder),N=H(()=>{const l=e.selectedOption;if(l)return l[e.labelField]}),E=H(()=>e.multiple?!!(Array.isArray(e.selectedOptions)&&e.selectedOptions.length):e.selectedOption!==null);function A(){var l;const{value:b}=s;if(b){const{value:U}=v;U&&(U.style.width=`${b.offsetWidth}px`,e.maxTagCount!=="responsive"&&((l=M.value)===null||l===void 0||l.sync({showAllItemsBeforeCalculate:!1})))}}function W(){const{value:l}=P;l&&(l.style.display="none")}function j(){const{value:l}=P;l&&(l.style.display="inline-block")}ze(X(e,"active"),l=>{l||W()}),ze(X(e,"pattern"),()=>{e.multiple&&so(A)});function Q(l){const{onFocus:b}=e;b&&b(l)}function Z(l){const{onBlur:b}=e;b&&b(l)}function G(l){const{onDeleteOption:b}=e;b&&b(l)}function Y(l){const{onClear:b}=e;b&&b(l)}function D(l){const{onPatternInput:b}=e;b&&b(l)}function fe(l){var b;(!l.relatedTarget||!(!((b=a.value)===null||b===void 0)&&b.contains(l.relatedTarget)))&&Q(l)}function me(l){var b;!((b=a.value)===null||b===void 0)&&b.contains(l.relatedTarget)||Z(l)}function te(l){Y(l)}function re(){S.value=!0}function Se(){S.value=!1}function de(l){!e.active||!e.filterable||l.target!==v.value&&l.preventDefault()}function ve(l){G(l)}const J=$(!1);function ne(l){if(l.key==="Backspace"&&!J.value&&!e.pattern.length){const{selectedOptions:b}=e;b!=null&&b.length&&ve(b[b.length-1])}}let ge=null;function i(l){const{value:b}=s;if(b){const U=l.target.value;b.textContent=U,A()}e.ignoreComposition&&J.value?ge=l:D(l)}function g(){J.value=!0}function L(){J.value=!1,e.ignoreComposition&&D(ge),ge=null}function le(l){var b;f.value=!0,(b=e.onPatternFocus)===null||b===void 0||b.call(e,l)}function be(l){var b;f.value=!1,(b=e.onPatternBlur)===null||b===void 0||b.call(e,l)}function ie(){var l,b;if(e.filterable)f.value=!1,(l=z.value)===null||l===void 0||l.blur(),(b=v.value)===null||b===void 0||b.blur();else if(e.multiple){const{value:U}=n;U==null||U.blur()}else{const{value:U}=m;U==null||U.blur()}}function ee(){var l,b,U;e.filterable?(f.value=!1,(l=z.value)===null||l===void 0||l.focus()):e.multiple?(b=n.value)===null||b===void 0||b.focus():(U=m.value)===null||U===void 0||U.focus()}function Ce(){const{value:l}=v;l&&(j(),l.focus())}function ce(){const{value:l}=v;l&&l.blur()}function ue(l){const{value:b}=w;b&&b.setTextContent(`+${l}`)}function Ie(){const{value:l}=x;return l}function $e(){return v.value}let ke=null;function Pe(){ke!==null&&window.clearTimeout(ke)}function Be(){e.active||(Pe(),ke=window.setTimeout(()=>{E.value&&(h.value=!0)},100))}function _e(){Pe()}function Ae(l){l||(Pe(),h.value=!1)}ze(E,l=>{l||(h.value=!1)}),Ke(()=>{mn(()=>{const l=z.value;l&&(e.disabled?l.removeAttribute("tabindex"):l.tabIndex=f.value?-1:0)})}),ko(a,e.onResize);const{inlineThemeDisabled:Fe}=e,Re=H(()=>{const{size:l}=e,{common:{cubicBezierEaseInOut:b},self:{fontWeight:U,borderRadius:Qe,color:Xe,placeholderColor:Ze,textColor:He,paddingSingle:Ne,paddingMultiple:De,caretColor:Je,colorDisabled:eo,textColorDisabled:Le,placeholderColorDisabled:xe,colorActive:o,boxShadowFocus:c,boxShadowActive:C,boxShadowHover:R,border:k,borderFocus:F,borderHover:T,borderActive:q,arrowColor:he,arrowColorDisabled:Fo,loadingColor:Ro,colorActiveWarning:To,boxShadowFocusWarning:Mo,boxShadowActiveWarning:Io,boxShadowHoverWarning:$o,borderWarning:Bo,borderFocusWarning:_o,borderHoverWarning:Ao,borderActiveWarning:Eo,colorActiveError:Ho,boxShadowFocusError:No,boxShadowActiveError:Do,boxShadowHoverError:Lo,borderError:Wo,borderFocusError:jo,borderHoverError:Vo,borderActiveError:Uo,clearColor:Ko,clearColorHover:qo,clearColorPressed:Go,clearSize:Yo,arrowSize:Qo,[K("height",l)]:Xo,[K("fontSize",l)]:Zo}}=y.value,We=Me(Ne),je=Me(De);return{"--n-bezier":b,"--n-border":k,"--n-border-active":q,"--n-border-focus":F,"--n-border-hover":T,"--n-border-radius":Qe,"--n-box-shadow-active":C,"--n-box-shadow-focus":c,"--n-box-shadow-hover":R,"--n-caret-color":Je,"--n-color":Xe,"--n-color-active":o,"--n-color-disabled":eo,"--n-font-size":Zo,"--n-height":Xo,"--n-padding-single-top":We.top,"--n-padding-multiple-top":je.top,"--n-padding-single-right":We.right,"--n-padding-multiple-right":je.right,"--n-padding-single-left":We.left,"--n-padding-multiple-left":je.left,"--n-padding-single-bottom":We.bottom,"--n-padding-multiple-bottom":je.bottom,"--n-placeholder-color":Ze,"--n-placeholder-color-disabled":xe,"--n-text-color":He,"--n-text-color-disabled":Le,"--n-arrow-color":he,"--n-arrow-color-disabled":Fo,"--n-loading-color":Ro,"--n-color-active-warning":To,"--n-box-shadow-focus-warning":Mo,"--n-box-shadow-active-warning":Io,"--n-box-shadow-hover-warning":$o,"--n-border-warning":Bo,"--n-border-focus-warning":_o,"--n-border-hover-warning":Ao,"--n-border-active-warning":Eo,"--n-color-active-error":Ho,"--n-box-shadow-focus-error":No,"--n-box-shadow-active-error":Do,"--n-box-shadow-hover-error":Lo,"--n-border-error":Wo,"--n-border-focus-error":jo,"--n-border-hover-error":Vo,"--n-border-active-error":Uo,"--n-clear-size":Yo,"--n-clear-color":Ko,"--n-clear-color-hover":qo,"--n-clear-color-pressed":Go,"--n-arrow-size":Qo,"--n-font-weight":U}}),ae=Fe?Ye("internal-selection",H(()=>e.size[0]),Re,e):void 0;return{mergedTheme:y,mergedClearable:p,mergedClsPrefix:r,rtlEnabled:d,patternInputFocused:f,filterablePlaceholder:O,label:N,selected:E,showTagsPanel:h,isComposing:J,counterRef:w,counterWrapperRef:x,patternInputMirrorRef:s,patternInputRef:v,selfRef:a,multipleElRef:n,singleElRef:m,patternInputWrapperRef:z,overflowRef:M,inputTagElRef:P,handleMouseDown:de,handleFocusin:fe,handleClear:te,handleMouseEnter:re,handleMouseLeave:Se,handleDeleteOption:ve,handlePatternKeyDown:ne,handlePatternInputInput:i,handlePatternInputBlur:be,handlePatternInputFocus:le,handleMouseEnterCounter:Be,handleMouseLeaveCounter:_e,handleFocusout:me,handleCompositionEnd:L,handleCompositionStart:g,onPopoverUpdateShow:Ae,focus:ee,focusInput:Ce,blur:ie,blurInput:ce,updateCounter:ue,getCounter:Ie,getTail:$e,renderLabel:e.renderLabel,cssVars:Fe?void 0:Re,themeClass:ae==null?void 0:ae.themeClass,onRender:ae==null?void 0:ae.onRender}},render(){const{status:e,multiple:r,size:t,disabled:d,filterable:s,maxTagCount:v,bordered:a,clsPrefix:n,ellipsisTagPopoverProps:m,onRender:z,renderTag:w,renderLabel:x}=this;z==null||z();const M=v==="responsive",P=typeof v=="number",h=M||P,f=u(gn,null,{default:()=>u(Rn,{clsPrefix:n,loading:this.loading,showArrow:this.showArrow,showClear:this.mergedClearable&&this.selected,onClear:this.handleClear},{default:()=>{var y,p;return(p=(y=this.$slots).arrow)===null||p===void 0?void 0:p.call(y)}})});let S;if(r){const{labelField:y}=this,p=D=>u("div",{class:`${n}-base-selection-tag-wrapper`,key:D.value},w?w({option:D,handleClose:()=>{this.handleDeleteOption(D)}}):u(lo,{size:t,closable:!D.disabled,disabled:d,onClose:()=>{this.handleDeleteOption(D)},internalCloseIsButtonTag:!1,internalCloseFocusable:!1},{default:()=>x?x(D,!0):Te(D[y],D,!0)})),O=()=>(P?this.selectedOptions.slice(0,v):this.selectedOptions).map(p),N=s?u("div",{class:`${n}-base-selection-input-tag`,ref:"inputTagElRef",key:"__input-tag__"},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",tabindex:-1,disabled:d,value:this.pattern,autofocus:this.autofocus,class:`${n}-base-selection-input-tag__input`,onBlur:this.handlePatternInputBlur,onFocus:this.handlePatternInputFocus,onKeydown:this.handlePatternKeyDown,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),u("span",{ref:"patternInputMirrorRef",class:`${n}-base-selection-input-tag__mirror`},this.pattern)):null,E=M?()=>u("div",{class:`${n}-base-selection-tag-wrapper`,ref:"counterWrapperRef"},u(lo,{size:t,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,onMouseleave:this.handleMouseLeaveCounter,disabled:d})):void 0;let A;if(P){const D=this.selectedOptions.length-v;D>0&&(A=u("div",{class:`${n}-base-selection-tag-wrapper`,key:"__counter__"},u(lo,{size:t,ref:"counterRef",onMouseenter:this.handleMouseEnterCounter,disabled:d},{default:()=>`+${D}`})))}const W=M?s?u(bo,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,getTail:this.getTail,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:O,counter:E,tail:()=>N}):u(bo,{ref:"overflowRef",updateCounter:this.updateCounter,getCounter:this.getCounter,style:{width:"100%",display:"flex",overflow:"hidden"}},{default:O,counter:E}):P&&A?O().concat(A):O(),j=h?()=>u("div",{class:`${n}-base-selection-popover`},M?O():this.selectedOptions.map(p)):void 0,Q=h?Object.assign({show:this.showTagsPanel,trigger:"hover",overlap:!0,placement:"top",width:"trigger",onUpdateShow:this.onPopoverUpdateShow,theme:this.mergedTheme.peers.Popover,themeOverrides:this.mergedTheme.peerOverrides.Popover},m):null,G=(this.selected?!1:this.active?!this.pattern&&!this.isComposing:!0)?u("div",{class:`${n}-base-selection-placeholder ${n}-base-selection-overlay`},u("div",{class:`${n}-base-selection-placeholder__inner`},this.placeholder)):null,Y=s?u("div",{ref:"patternInputWrapperRef",class:`${n}-base-selection-tags`},W,M?null:N,f):u("div",{ref:"multipleElRef",class:`${n}-base-selection-tags`,tabindex:d?void 0:0},W,f);S=u(bn,null,h?u(pn,Object.assign({},Q,{scrollable:!0,style:"max-height: calc(var(--v-target-height) * 6.6);"}),{trigger:()=>Y,default:j}):Y,G)}else if(s){const y=this.pattern||this.isComposing,p=this.active?!y:!this.selected,O=this.active?!1:this.selected;S=u("div",{ref:"patternInputWrapperRef",class:`${n}-base-selection-label`,title:this.patternInputFocused?void 0:po(this.label)},u("input",Object.assign({},this.inputProps,{ref:"patternInputRef",class:`${n}-base-selection-input`,value:this.active?this.pattern:"",placeholder:"",readonly:d,disabled:d,tabindex:-1,autofocus:this.autofocus,onFocus:this.handlePatternInputFocus,onBlur:this.handlePatternInputBlur,onInput:this.handlePatternInputInput,onCompositionstart:this.handleCompositionStart,onCompositionend:this.handleCompositionEnd})),O?u("div",{class:`${n}-base-selection-label__render-label ${n}-base-selection-overlay`,key:"input"},u("div",{class:`${n}-base-selection-overlay__wrapper`},w?w({option:this.selectedOption,handleClose:()=>{}}):x?x(this.selectedOption,!0):Te(this.label,this.selectedOption,!0))):null,p?u("div",{class:`${n}-base-selection-placeholder ${n}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${n}-base-selection-overlay__wrapper`},this.filterablePlaceholder)):null,f)}else S=u("div",{ref:"singleElRef",class:`${n}-base-selection-label`,tabindex:this.disabled?void 0:0},this.label!==void 0?u("div",{class:`${n}-base-selection-input`,title:po(this.label),key:"input"},u("div",{class:`${n}-base-selection-input__content`},w?w({option:this.selectedOption,handleClose:()=>{}}):x?x(this.selectedOption,!0):Te(this.label,this.selectedOption,!0))):u("div",{class:`${n}-base-selection-placeholder ${n}-base-selection-overlay`,key:"placeholder"},u("div",{class:`${n}-base-selection-placeholder__inner`},this.placeholder)),f);return u("div",{ref:"selfRef",class:[`${n}-base-selection`,this.rtlEnabled&&`${n}-base-selection--rtl`,this.themeClass,e&&`${n}-base-selection--${e}-status`,{[`${n}-base-selection--active`]:this.active,[`${n}-base-selection--selected`]:this.selected||this.active&&this.pattern,[`${n}-base-selection--disabled`]:this.disabled,[`${n}-base-selection--multiple`]:this.multiple,[`${n}-base-selection--focus`]:this.focused}],style:this.cssVars,onClick:this.onClick,onMouseenter:this.handleMouseEnter,onMouseleave:this.handleMouseLeave,onKeydown:this.onKeydown,onFocusin:this.handleFocusin,onFocusout:this.handleFocusout,onMousedown:this.handleMouseDown},S,a?u("div",{class:`${n}-base-selection__border`}):null,a?u("div",{class:`${n}-base-selection__state-border`}):null)}});function Ue(e){return e.type==="group"}function zo(e){return e.type==="ignored"}function ro(e,r){try{return!!(1+r.toString().toLowerCase().indexOf(e.trim().toLowerCase()))}catch{return!1}}function et(e,r){return{getIsGroup:Ue,getIgnored:zo,getKey(d){return Ue(d)?d.name||d.key||"key-required":d[e]},getChildren(d){return d[r]}}}function ot(e,r,t,d){if(!r)return e;function s(v){if(!Array.isArray(v))return[];const a=[];for(const n of v)if(Ue(n)){const m=s(n[d]);m.length&&a.push(Object.assign({},n,{[d]:m}))}else{if(zo(n))continue;r(t,n)&&a.push(n)}return a}return s(e)}function nt(e,r,t){const d=new Map;return e.forEach(s=>{Ue(s)?s[t].forEach(v=>{d.set(v[r],v)}):d.set(s[r],s)}),d}function tt(e){const{boxShadow2:r}=e;return{menuBoxShadow:r}}const lt=co({name:"Select",common:qe,peers:{InternalSelection:Oo,InternalSelectMenu:Po},self:tt}),rt=oe([I("select",`
 z-index: auto;
 outline: none;
 width: 100%;
 position: relative;
 font-weight: var(--n-font-weight);
 `),I("select-menu",`
 margin: 4px 0;
 box-shadow: var(--n-menu-box-shadow);
 `,[So({originalTransition:"background-color .3s var(--n-bezier), box-shadow .3s var(--n-bezier)"})])]),it=Object.assign(Object.assign({},we.props),{to:ao.propTo,bordered:{type:Boolean,default:void 0},clearable:Boolean,clearCreatedOptionsOnClear:{type:Boolean,default:!0},clearFilterAfterSelect:{type:Boolean,default:!0},options:{type:Array,default:()=>[]},defaultValue:{type:[String,Number,Array],default:null},keyboard:{type:Boolean,default:!0},value:[String,Number,Array],placeholder:String,menuProps:Object,multiple:Boolean,size:String,menuSize:{type:String},filterable:Boolean,disabled:{type:Boolean,default:void 0},remote:Boolean,loading:Boolean,filter:Function,placement:{type:String,default:"bottom-start"},widthMode:{type:String,default:"trigger"},tag:Boolean,onCreate:Function,fallbackOption:{type:[Function,Boolean],default:void 0},show:{type:Boolean,default:void 0},showArrow:{type:Boolean,default:!0},maxTagCount:[Number,String],ellipsisTagPopoverProps:Object,consistentMenuWidth:{type:Boolean,default:!0},virtualScroll:{type:Boolean,default:!0},labelField:{type:String,default:"label"},valueField:{type:String,default:"value"},childrenField:{type:String,default:"children"},renderLabel:Function,renderOption:Function,renderTag:Function,"onUpdate:value":[Function,Array],inputProps:Object,nodeProps:Function,ignoreComposition:{type:Boolean,default:!0},showOnFocus:Boolean,onUpdateValue:[Function,Array],onBlur:[Function,Array],onClear:[Function,Array],onFocus:[Function,Array],onScroll:[Function,Array],onSearch:[Function,Array],onUpdateShow:[Function,Array],"onUpdate:show":[Function,Array],displayDirective:{type:String,default:"show"},resetMenuOnOptionsChange:{type:Boolean,default:!0},status:String,showCheckmark:{type:Boolean,default:!0},scrollbarProps:Object,onChange:[Function,Array],items:Array}),ut=ye({name:"Select",props:it,slots:Object,setup(e){const{mergedClsPrefixRef:r,mergedBorderedRef:t,namespaceRef:d,inlineThemeDisabled:s,mergedComponentPropsRef:v}=Ge(e),a=we("Select","-select",rt,lt,e,r),n=$(e.defaultValue),m=X(e,"value"),z=go(m,n),w=$(!1),x=$(""),M=zn(e,["items","options"]),P=$([]),h=$([]),f=H(()=>h.value.concat(P.value).concat(M.value)),S=H(()=>{const{filter:o}=e;if(o)return o;const{labelField:c,valueField:C}=e;return(R,k)=>{if(!k)return!1;const F=k[c];if(typeof F=="string")return ro(R,F);const T=k[C];return typeof T=="string"?ro(R,T):typeof T=="number"?ro(R,String(T)):!1}}),y=H(()=>{if(e.remote)return M.value;{const{value:o}=f,{value:c}=x;return!c.length||!e.filterable?o:ot(o,S.value,c,e.childrenField)}}),p=H(()=>{const{valueField:o,childrenField:c}=e,C=et(o,c);return Fn(y.value,C)}),O=H(()=>nt(f.value,e.valueField,e.childrenField)),N=$(!1),E=go(X(e,"show"),N),A=$(null),W=$(null),j=$(null),{localeRef:Q}=Tn("Select"),Z=H(()=>{var o;return(o=e.placeholder)!==null&&o!==void 0?o:Q.value.placeholder}),G=[],Y=$(new Map),D=H(()=>{const{fallbackOption:o}=e;if(o===void 0){const{labelField:c,valueField:C}=e;return R=>({[c]:String(R),[C]:R})}return o===!1?!1:c=>Object.assign(o(c),{value:c})});function fe(o){const c=e.remote,{value:C}=Y,{value:R}=O,{value:k}=D,F=[];return o.forEach(T=>{if(R.has(T))F.push(R.get(T));else if(c&&C.has(T))F.push(C.get(T));else if(k){const q=k(T);q&&F.push(q)}}),F}const me=H(()=>{if(e.multiple){const{value:o}=z;return Array.isArray(o)?fe(o):[]}return null}),te=H(()=>{const{value:o}=z;return!e.multiple&&!Array.isArray(o)?o===null?null:fe([o])[0]||null:null}),re=kn(e,{mergedSize:o=>{var c,C;const{size:R}=e;if(R)return R;const{mergedSize:k}=o||{};if(k!=null&&k.value)return k.value;const F=(C=(c=v==null?void 0:v.value)===null||c===void 0?void 0:c.Select)===null||C===void 0?void 0:C.size;return F||"medium"}}),{mergedSizeRef:Se,mergedDisabledRef:de,mergedStatusRef:ve}=re;function J(o,c){const{onChange:C,"onUpdate:value":R,onUpdateValue:k}=e,{nTriggerFormChange:F,nTriggerFormInput:T}=re;C&&se(C,o,c),k&&se(k,o,c),R&&se(R,o,c),n.value=o,F(),T()}function ne(o){const{onBlur:c}=e,{nTriggerFormBlur:C}=re;c&&se(c,o),C()}function ge(){const{onClear:o}=e;o&&se(o)}function i(o){const{onFocus:c,showOnFocus:C}=e,{nTriggerFormFocus:R}=re;c&&se(c,o),R(),C&&ie()}function g(o){const{onSearch:c}=e;c&&se(c,o)}function L(o){const{onScroll:c}=e;c&&se(c,o)}function le(){var o;const{remote:c,multiple:C}=e;if(c){const{value:R}=Y;if(C){const{valueField:k}=e;(o=me.value)===null||o===void 0||o.forEach(F=>{R.set(F[k],F)})}else{const k=te.value;k&&R.set(k[e.valueField],k)}}}function be(o){const{onUpdateShow:c,"onUpdate:show":C}=e;c&&se(c,o),C&&se(C,o),N.value=o}function ie(){de.value||(be(!0),N.value=!0,e.filterable&&De())}function ee(){be(!1)}function Ce(){x.value="",h.value=G}const ce=$(!1);function ue(){e.filterable&&(ce.value=!0)}function Ie(){e.filterable&&(ce.value=!1,E.value||Ce())}function $e(){de.value||(E.value?e.filterable?De():ee():ie())}function ke(o){var c,C;!((C=(c=j.value)===null||c===void 0?void 0:c.selfRef)===null||C===void 0)&&C.contains(o.relatedTarget)||(w.value=!1,ne(o),ee())}function Pe(o){i(o),w.value=!0}function Be(){w.value=!0}function _e(o){var c;!((c=A.value)===null||c===void 0)&&c.$el.contains(o.relatedTarget)||(w.value=!1,ne(o),ee())}function Ae(){var o;(o=A.value)===null||o===void 0||o.focus(),ee()}function Fe(o){var c;E.value&&(!((c=A.value)===null||c===void 0)&&c.$el.contains(On(o))||ee())}function Re(o){if(!Array.isArray(o))return[];if(D.value)return Array.from(o);{const{remote:c}=e,{value:C}=O;if(c){const{value:R}=Y;return o.filter(k=>C.has(k)||R.has(k))}else return o.filter(R=>C.has(R))}}function ae(o){l(o.rawNode)}function l(o){if(de.value)return;const{tag:c,remote:C,clearFilterAfterSelect:R,valueField:k}=e;if(c&&!C){const{value:F}=h,T=F[0]||null;if(T){const q=P.value;q.length?q.push(T):P.value=[T],h.value=G}}if(C&&Y.value.set(o[k],o),e.multiple){const F=Re(z.value),T=F.findIndex(q=>q===o[k]);if(~T){if(F.splice(T,1),c&&!C){const q=b(o[k]);~q&&(P.value.splice(q,1),R&&(x.value=""))}}else F.push(o[k]),R&&(x.value="");J(F,fe(F))}else{if(c&&!C){const F=b(o[k]);~F?P.value=[P.value[F]]:P.value=G}Ne(),ee(),J(o[k],o)}}function b(o){return P.value.findIndex(C=>C[e.valueField]===o)}function U(o){E.value||ie();const{value:c}=o.target;x.value=c;const{tag:C,remote:R}=e;if(g(c),C&&!R){if(!c){h.value=G;return}const{onCreate:k}=e,F=k?k(c):{[e.labelField]:c,[e.valueField]:c},{valueField:T,labelField:q}=e;M.value.some(he=>he[T]===F[T]||he[q]===F[q])||P.value.some(he=>he[T]===F[T]||he[q]===F[q])?h.value=G:h.value=[F]}}function Qe(o){o.stopPropagation();const{multiple:c,tag:C,remote:R,clearCreatedOptionsOnClear:k}=e;!c&&e.filterable&&ee(),C&&!R&&k&&(P.value=G),ge(),c?J([],[]):J(null,null)}function Xe(o){!Ee(o,"action")&&!Ee(o,"empty")&&!Ee(o,"header")&&o.preventDefault()}function Ze(o){L(o)}function He(o){var c,C,R,k,F;if(!e.keyboard){o.preventDefault();return}switch(o.key){case" ":if(e.filterable)break;o.preventDefault();case"Enter":if(!(!((c=A.value)===null||c===void 0)&&c.isComposing)){if(E.value){const T=(C=j.value)===null||C===void 0?void 0:C.getPendingTmNode();T?ae(T):e.filterable||(ee(),Ne())}else if(ie(),e.tag&&ce.value){const T=h.value[0];if(T){const q=T[e.valueField],{value:he}=z;e.multiple&&Array.isArray(he)&&he.includes(q)||l(T)}}}o.preventDefault();break;case"ArrowUp":if(o.preventDefault(),e.loading)return;E.value&&((R=j.value)===null||R===void 0||R.prev());break;case"ArrowDown":if(o.preventDefault(),e.loading)return;E.value?(k=j.value)===null||k===void 0||k.next():ie();break;case"Escape":E.value&&($n(o),ee()),(F=A.value)===null||F===void 0||F.focus();break}}function Ne(){var o;(o=A.value)===null||o===void 0||o.focus()}function De(){var o;(o=A.value)===null||o===void 0||o.focusInput()}function Je(){var o;E.value&&((o=W.value)===null||o===void 0||o.syncPosition())}le(),ze(X(e,"options"),le);const eo={focus:()=>{var o;(o=A.value)===null||o===void 0||o.focus()},focusInput:()=>{var o;(o=A.value)===null||o===void 0||o.focusInput()},blur:()=>{var o;(o=A.value)===null||o===void 0||o.blur()},blurInput:()=>{var o;(o=A.value)===null||o===void 0||o.blurInput()}},Le=H(()=>{const{self:{menuBoxShadow:o}}=a.value;return{"--n-menu-box-shadow":o}}),xe=s?Ye("select",void 0,Le,e):void 0;return Object.assign(Object.assign({},eo),{mergedStatus:ve,mergedClsPrefix:r,mergedBordered:t,namespace:d,treeMate:p,isMounted:Pn(),triggerRef:A,menuRef:j,pattern:x,uncontrolledShow:N,mergedShow:E,adjustedTo:ao(e),uncontrolledValue:n,mergedValue:z,followerRef:W,localizedPlaceholder:Z,selectedOption:te,selectedOptions:me,mergedSize:Se,mergedDisabled:de,focused:w,activeWithoutMenuOpen:ce,inlineThemeDisabled:s,onTriggerInputFocus:ue,onTriggerInputBlur:Ie,handleTriggerOrMenuResize:Je,handleMenuFocus:Be,handleMenuBlur:_e,handleMenuTabOut:Ae,handleTriggerClick:$e,handleToggle:ae,handleDeleteOption:l,handlePatternInput:U,handleClear:Qe,handleTriggerBlur:ke,handleTriggerFocus:Pe,handleKeydown:He,handleMenuAfterLeave:Ce,handleMenuClickOutside:Fe,handleMenuScroll:Ze,handleMenuKeydown:He,handleMenuMousedown:Xe,mergedTheme:a,cssVars:s?void 0:Le,themeClass:xe==null?void 0:xe.themeClass,onRender:xe==null?void 0:xe.onRender})},render(){return u("div",{class:`${this.mergedClsPrefix}-select`},u(Cn,null,{default:()=>[u(xn,null,{default:()=>u(Jn,{ref:"triggerRef",inlineThemeDisabled:this.inlineThemeDisabled,status:this.mergedStatus,inputProps:this.inputProps,clsPrefix:this.mergedClsPrefix,showArrow:this.showArrow,maxTagCount:this.maxTagCount,ellipsisTagPopoverProps:this.ellipsisTagPopoverProps,bordered:this.mergedBordered,active:this.activeWithoutMenuOpen||this.mergedShow,pattern:this.pattern,placeholder:this.localizedPlaceholder,selectedOption:this.selectedOption,selectedOptions:this.selectedOptions,multiple:this.multiple,renderTag:this.renderTag,renderLabel:this.renderLabel,filterable:this.filterable,clearable:this.clearable,disabled:this.mergedDisabled,size:this.mergedSize,theme:this.mergedTheme.peers.InternalSelection,labelField:this.labelField,valueField:this.valueField,themeOverrides:this.mergedTheme.peerOverrides.InternalSelection,loading:this.loading,focused:this.focused,onClick:this.handleTriggerClick,onDeleteOption:this.handleDeleteOption,onPatternInput:this.handlePatternInput,onClear:this.handleClear,onBlur:this.handleTriggerBlur,onFocus:this.handleTriggerFocus,onKeydown:this.handleKeydown,onPatternBlur:this.onTriggerInputBlur,onPatternFocus:this.onTriggerInputFocus,onResize:this.handleTriggerOrMenuResize,ignoreComposition:this.ignoreComposition},{arrow:()=>{var e,r;return[(r=(e=this.$slots).arrow)===null||r===void 0?void 0:r.call(e)]}})}),u(wn,{ref:"followerRef",show:this.mergedShow,to:this.adjustedTo,teleportDisabled:this.adjustedTo===ao.tdkey,containerClass:this.namespace,width:this.consistentMenuWidth?"target":void 0,minWidth:"target",placement:this.placement},{default:()=>u(yo,{name:"fade-in-scale-up-transition",appear:this.isMounted,onAfterLeave:this.handleMenuAfterLeave},{default:()=>{var e,r,t;return this.mergedShow||this.displayDirective==="show"?((e=this.onRender)===null||e===void 0||e.call(this),yn(u(Wn,Object.assign({},this.menuProps,{ref:"menuRef",onResize:this.handleTriggerOrMenuResize,inlineThemeDisabled:this.inlineThemeDisabled,virtualScroll:this.consistentMenuWidth&&this.virtualScroll,class:[`${this.mergedClsPrefix}-select-menu`,this.themeClass,(r=this.menuProps)===null||r===void 0?void 0:r.class],clsPrefix:this.mergedClsPrefix,focusable:!0,labelField:this.labelField,valueField:this.valueField,autoPending:!0,nodeProps:this.nodeProps,theme:this.mergedTheme.peers.InternalSelectMenu,themeOverrides:this.mergedTheme.peerOverrides.InternalSelectMenu,treeMate:this.treeMate,multiple:this.multiple,size:this.menuSize,renderOption:this.renderOption,renderLabel:this.renderLabel,value:this.mergedValue,style:[(t=this.menuProps)===null||t===void 0?void 0:t.style,this.cssVars],onToggle:this.handleToggle,onScroll:this.handleMenuScroll,onFocus:this.handleMenuFocus,onBlur:this.handleMenuBlur,onKeydown:this.handleMenuKeydown,onTabOut:this.handleMenuTabOut,onMousedown:this.handleMenuMousedown,show:this.mergedShow,showCheckmark:this.showCheckmark,resetMenuOnOptionsChange:this.resetMenuOnOptionsChange,scrollbarProps:this.scrollbarProps}),{empty:()=>{var d,s;return[(s=(d=this.$slots).empty)===null||s===void 0?void 0:s.call(d)]},header:()=>{var d,s;return[(s=(d=this.$slots).header)===null||s===void 0?void 0:s.call(d)]},action:()=>{var d,s;return[(s=(d=this.$slots).action)===null||s===void 0?void 0:s.call(d)]}}),this.displayDirective==="show"?[[Sn,this.mergedShow],[vo,this.handleMenuClickOutside,void 0,{capture:!0}]]:[[vo,this.handleMenuClickOutside,void 0,{capture:!0}]])):null}})})]}))}});export{ut as N,Wn as a,et as c,Po as i,to as m,lt as s};
