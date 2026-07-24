import{H as _,c as te,w as ue,ag as Ze,p as j,F as N,an as fe,g as P,X as d,ao as Oe,d as S,a4 as ee,W as Ve,V as De,a6 as Ae}from"./index-CmgDVxvd.js";import{v as B,a as H,o as M,C as We,z as J,r as Ke,b as oe,f as k,c as C,P as L,at as Ue,N as he,d as ge,g as I,u as be,m as O,as as qe,p as ve,s as m,L as Xe,O as u,k as le,n as Ye,q as Ge,t as Je}from"./browser-Dt-CiqTS.js";import{c as Qe}from"./index-BJKaMiZy.js";import{c as se}from"./Button-BYinrBhG.js";function Ne(e){const o=_(!!e.value);if(o.value)return te(o);const n=ue(e,r=>{r&&(o.value=!0,n())});return te(o)}function Io(){return Ze()!==null}const So=typeof window<"u",$o=B("n-drawer-body"),Eo=B("n-modal-body"),wo=B("n-modal-provider"),Po=B("n-modal"),Bo=B("n-popover-body");function ae(e,o,n="default"){const r=o[n];if(r===void 0)throw new Error(`[vueuc/${e}]: slot[${n}] is empty.`);return r()}function Q(e,o=!0,n=[]){return e.forEach(r=>{if(r!==null){if(typeof r!="object"){(typeof r=="string"||typeof r=="number")&&n.push(j(String(r)));return}if(Array.isArray(r)){Q(r,o,n);return}if(r.type===N){if(r.children===null)return;Array.isArray(r.children)&&Q(r.children,o,n)}else r.type!==fe&&n.push(r)}}),n}function To(e,o,n="default"){const r=o[n];if(r===void 0)throw new Error(`[vueuc/${e}]: slot[${n}] is empty.`);const t=Q(r());if(t.length===1)return t[0];throw new Error(`[vueuc/${e}]: slot[${n}] should have exactly one child.`)}const E="@@coContext",Fo={mounted(e,{value:o,modifiers:n}){e[E]={handler:void 0},typeof o=="function"&&(e[E].handler=o,M("clickoutside",e,o,{capture:n.capture}))},updated(e,{value:o,modifiers:n}){const r=e[E];typeof o=="function"?r.handler?r.handler!==o&&(H("clickoutside",e,r.handler,{capture:n.capture}),r.handler=o,M("clickoutside",e,o,{capture:n.capture})):(e[E].handler=o,M("clickoutside",e,o,{capture:n.capture})):r.handler&&(H("clickoutside",e,r.handler,{capture:n.capture}),r.handler=void 0)},unmounted(e,{modifiers:o}){const{handler:n}=e[E];n&&H("clickoutside",e,n,{capture:o.capture}),e[E].handler=void 0}};function eo(e,o){console.error(`[vdirs/${e}]: ${o}`)}class oo{constructor(){this.elementZIndex=new Map,this.nextZIndex=2e3}get elementCount(){return this.elementZIndex.size}ensureZIndex(o,n){const{elementZIndex:r}=this;if(n!==void 0){o.style.zIndex=`${n}`,r.delete(o);return}const{nextZIndex:t}=this;r.has(o)&&r.get(o)+1===this.nextZIndex||(o.style.zIndex=`${t}`,r.set(o,t),this.nextZIndex=t+1,this.squashState())}unregister(o,n){const{elementZIndex:r}=this;r.has(o)?r.delete(o):n===void 0&&eo("z-index-manager/unregister-element","Element not found when unregistering."),this.squashState()}squashState(){const{elementCount:o}=this;o||(this.nextZIndex=2e3),this.nextZIndex-o>2500&&this.rearrange()}rearrange(){const o=Array.from(this.elementZIndex.entries());o.sort((n,r)=>n[1]-r[1]),this.nextZIndex=2e3,o.forEach(n=>{const r=n[0],t=this.nextZIndex++;`${t}`!==r.style.zIndex&&(r.style.zIndex=`${t}`)})}}const G=new oo,w="@@ziContext",Lo={mounted(e,o){const{value:n={}}=o,{zIndex:r,enabled:t}=n;e[w]={enabled:!!t,initialized:!1},t&&(G.ensureZIndex(e,r),e[w].initialized=!0)},updated(e,o){const{value:n={}}=o,{zIndex:r,enabled:t}=n,s=e[w].enabled;t&&!s&&(G.ensureZIndex(e,r),e[w].initialized=!0),e[w].enabled=!!t},unmounted(e,o){if(!e[w].initialized)return;const{value:n={}}=o,{zIndex:r}=n;G.unregister(e,r)}};function ce(e){return typeof e=="string"?document.querySelector(e):e()||null}const Ho=P({name:"LazyTeleport",props:{to:{type:[String,Object],default:void 0},disabled:Boolean,show:{type:Boolean,required:!0}},setup(e){return{showTeleport:Ne(ee(e,"show")),mergedTo:S(()=>{const{to:o}=e;return o??"body"})}},render(){return this.showTeleport?this.disabled?ae("lazy-teleport",this.$slots):d(Oe,{disabled:this.disabled,to:this.mergedTo},ae("lazy-teleport",this.$slots)):null}});function pe(e){return e instanceof HTMLElement}function Ce(e){for(let o=0;o<e.childNodes.length;o++){const n=e.childNodes[o];if(pe(n)&&(xe(n)||Ce(n)))return!0}return!1}function me(e){for(let o=e.childNodes.length-1;o>=0;o--){const n=e.childNodes[o];if(pe(n)&&(xe(n)||me(n)))return!0}return!1}function xe(e){if(!no(e))return!1;try{e.focus({preventScroll:!0})}catch{}return document.activeElement===e}function no(e){if(e.tabIndex>0||e.tabIndex===0&&e.getAttribute("tabIndex")!==null)return!0;if(e.getAttribute("disabled"))return!1;switch(e.nodeName){case"A":return!!e.href&&e.rel!=="ignore";case"INPUT":return e.type!=="hidden"&&e.type!=="file";case"SELECT":case"TEXTAREA":return!0;default:return!1}}let F=[];const Ro=P({name:"FocusTrap",props:{disabled:Boolean,active:Boolean,autoFocus:{type:Boolean,default:!0},onEsc:Function,initialFocusTo:[String,Function],finalFocusTo:[String,Function],returnFocusOnDeactivated:{type:Boolean,default:!0}},setup(e){const o=Qe(),n=_(null),r=_(null);let t=!1,s=!1;const f=typeof document>"u"?null:document.activeElement;function i(){return F[F.length-1]===o}function g(l){var a;l.code==="Escape"&&i()&&((a=e.onEsc)===null||a===void 0||a.call(e,l))}Ve(()=>{ue(()=>e.active,l=>{l?(b(),M("keydown",document,g)):(H("keydown",document,g),t&&y())},{immediate:!0})}),De(()=>{H("keydown",document,g),t&&y()});function p(l){if(!s&&i()){const a=h();if(a===null||a.contains(We(l)))return;x("first")}}function h(){const l=n.value;if(l===null)return null;let a=l;for(;a=a.nextSibling,!(a===null||a instanceof Element&&a.tagName==="DIV"););return a}function b(){var l;if(!e.disabled){if(F.push(o),e.autoFocus){const{initialFocusTo:a}=e;a===void 0?x("first"):(l=ce(a))===null||l===void 0||l.focus({preventScroll:!0})}t=!0,document.addEventListener("focus",p,!0)}}function y(){var l;if(e.disabled||(document.removeEventListener("focus",p,!0),F=F.filter(v=>v!==o),i()))return;const{finalFocusTo:a}=e;a!==void 0?(l=ce(a))===null||l===void 0||l.focus({preventScroll:!0}):e.returnFocusOnDeactivated&&f instanceof HTMLElement&&(s=!0,f.focus({preventScroll:!0}),s=!1)}function x(l){if(i()&&e.active){const a=n.value,v=r.value;if(a!==null&&v!==null){const $=h();if($==null||$===v){s=!0,a.focus({preventScroll:!0}),s=!1;return}s=!0;const T=l==="first"?Ce($):me($);s=!1,T||(s=!0,a.focus({preventScroll:!0}),s=!1)}}}function z(l){if(s)return;const a=h();a!==null&&(l.relatedTarget!==null&&a.contains(l.relatedTarget)?x("last"):x("first"))}function c(l){s||(l.relatedTarget!==null&&l.relatedTarget===n.value?x("last"):x("first"))}return{focusableStartRef:n,focusableEndRef:r,focusableStyle:"position: absolute; height: 0; width: 0;",handleStartFocus:z,handleEndFocus:c}},render(){const{default:e}=this.$slots;if(e===void 0)return null;if(this.disabled)return e();const{active:o,focusableStyle:n}=this;return d(N,null,[d("div",{"aria-hidden":"true",tabindex:o?"0":"-1",ref:"focusableStartRef",style:n,onFocus:this.handleStartFocus}),e(),d("div",{"aria-hidden":"true",style:n,ref:"focusableEndRef",tabindex:o?"0":"-1",onFocus:this.handleEndFocus})])}}),ye=new WeakSet;function Mo(e){ye.add(e)}function _o(e){return!ye.has(e)}function Z(e,o=!0,n=[]){return e.forEach(r=>{if(r!==null){if(typeof r!="object"){(typeof r=="string"||typeof r=="number")&&n.push(j(String(r)));return}if(Array.isArray(r)){Z(r,o,n);return}if(r.type===N){if(r.children===null)return;Array.isArray(r.children)&&Z(r.children,o,n)}else{if(r.type===fe&&o)return;n.push(r)}}}),n}function jo(e,o="default",n=void 0){const r=e[o];if(!r)return J("getFirstSlotVNode",`slot[${o}] is empty`),null;const t=Z(r(n));return t.length===1?t[0]:(J("getFirstSlotVNode",`slot[${o}] should have exactly one child`),null)}function Zo(e,o,n){if(!o)return null;const r=Z(o(n));return r.length===1?r[0]:(J("getFirstSlotVNode",`slot[${e}] should have exactly one child`),null)}function Oo(e,o=[],n){const r={};return o.forEach(t=>{r[t]=e[t]}),Object.assign(r,n)}function Vo(e,...o){return typeof e=="function"?e(...o):typeof e=="string"?j(e):typeof e=="number"?j(String(e)):null}const ro=Ke("close",()=>d("svg",{viewBox:"0 0 12 12",version:"1.1",xmlns:"http://www.w3.org/2000/svg","aria-hidden":!0},d("g",{stroke:"none","stroke-width":"1",fill:"none","fill-rule":"evenodd"},d("g",{fill:"currentColor","fill-rule":"nonzero"},d("path",{d:"M2.08859116,2.2156945 L2.14644661,2.14644661 C2.32001296,1.97288026 2.58943736,1.95359511 2.7843055,2.08859116 L2.85355339,2.14644661 L6,5.293 L9.14644661,2.14644661 C9.34170876,1.95118446 9.65829124,1.95118446 9.85355339,2.14644661 C10.0488155,2.34170876 10.0488155,2.65829124 9.85355339,2.85355339 L6.707,6 L9.85355339,9.14644661 C10.0271197,9.32001296 10.0464049,9.58943736 9.91140884,9.7843055 L9.85355339,9.85355339 C9.67998704,10.0271197 9.41056264,10.0464049 9.2156945,9.91140884 L9.14644661,9.85355339 L6,6.707 L2.85355339,9.85355339 C2.65829124,10.0488155 2.34170876,10.0488155 2.14644661,9.85355339 C1.95118446,9.65829124 1.95118446,9.34170876 2.14644661,9.14644661 L5.293,6 L2.14644661,2.85355339 C1.97288026,2.67998704 1.95359511,2.41056264 2.08859116,2.2156945 L2.14644661,2.14644661 L2.08859116,2.2156945 Z"}))))),to=P({name:"Empty",render(){return d("svg",{viewBox:"0 0 28 28",fill:"none",xmlns:"http://www.w3.org/2000/svg"},d("path",{d:"M26 7.5C26 11.0899 23.0899 14 19.5 14C15.9101 14 13 11.0899 13 7.5C13 3.91015 15.9101 1 19.5 1C23.0899 1 26 3.91015 26 7.5ZM16.8536 4.14645C16.6583 3.95118 16.3417 3.95118 16.1464 4.14645C15.9512 4.34171 15.9512 4.65829 16.1464 4.85355L18.7929 7.5L16.1464 10.1464C15.9512 10.3417 15.9512 10.6583 16.1464 10.8536C16.3417 11.0488 16.6583 11.0488 16.8536 10.8536L19.5 8.20711L22.1464 10.8536C22.3417 11.0488 22.6583 11.0488 22.8536 10.8536C23.0488 10.6583 23.0488 10.3417 22.8536 10.1464L20.2071 7.5L22.8536 4.85355C23.0488 4.65829 23.0488 4.34171 22.8536 4.14645C22.6583 3.95118 22.3417 3.95118 22.1464 4.14645L19.5 6.79289L16.8536 4.14645Z",fill:"currentColor"}),d("path",{d:"M25 22.75V12.5991C24.5572 13.0765 24.053 13.4961 23.5 13.8454V16H17.5L17.3982 16.0068C17.0322 16.0565 16.75 16.3703 16.75 16.75C16.75 18.2688 15.5188 19.5 14 19.5C12.4812 19.5 11.25 18.2688 11.25 16.75L11.2432 16.6482C11.1935 16.2822 10.8797 16 10.5 16H4.5V7.25C4.5 6.2835 5.2835 5.5 6.25 5.5H12.2696C12.4146 4.97463 12.6153 4.47237 12.865 4H6.25C4.45507 4 3 5.45507 3 7.25V22.75C3 24.5449 4.45507 26 6.25 26H21.75C23.5449 26 25 24.5449 25 22.75ZM4.5 22.75V17.5H9.81597L9.85751 17.7041C10.2905 19.5919 11.9808 21 14 21L14.215 20.9947C16.2095 20.8953 17.842 19.4209 18.184 17.5H23.5V22.75C23.5 23.7165 22.7165 24.5 21.75 24.5H6.25C5.2835 24.5 4.5 23.7165 4.5 22.75Z",fill:"currentColor"}))}}),lo=oe("base-close",`
 display: flex;
 align-items: center;
 justify-content: center;
 cursor: pointer;
 background-color: transparent;
 color: var(--n-close-icon-color);
 border-radius: var(--n-close-border-radius);
 height: var(--n-close-size);
 width: var(--n-close-size);
 font-size: var(--n-close-icon-size);
 outline: none;
 border: none;
 position: relative;
 padding: 0;
`,[k("absolute",`
 height: var(--n-close-icon-size);
 width: var(--n-close-icon-size);
 `),C("&::before",`
 content: "";
 position: absolute;
 width: var(--n-close-size);
 height: var(--n-close-size);
 left: 50%;
 top: 50%;
 transform: translateY(-50%) translateX(-50%);
 transition: inherit;
 border-radius: inherit;
 `),L("disabled",[C("&:hover",`
 color: var(--n-close-icon-color-hover);
 `),C("&:hover::before",`
 background-color: var(--n-close-color-hover);
 `),C("&:focus::before",`
 background-color: var(--n-close-color-hover);
 `),C("&:active",`
 color: var(--n-close-icon-color-pressed);
 `),C("&:active::before",`
 background-color: var(--n-close-color-pressed);
 `)]),k("disabled",`
 cursor: not-allowed;
 color: var(--n-close-icon-color-disabled);
 background-color: transparent;
 `),k("round",[C("&::before",`
 border-radius: 50%;
 `)])]),so=P({name:"BaseClose",props:{isButtonTag:{type:Boolean,default:!0},clsPrefix:{type:String,required:!0},disabled:{type:Boolean,default:void 0},focusable:{type:Boolean,default:!0},round:Boolean,onClick:Function,absolute:Boolean},setup(e){return Ue("-base-close",lo,ee(e,"clsPrefix")),()=>{const{clsPrefix:o,disabled:n,absolute:r,round:t,isButtonTag:s}=e;return d(s?"button":"div",{type:s?"button":void 0,tabindex:n||!e.focusable?-1:0,"aria-disabled":n,"aria-label":"close",role:s?void 0:"button",disabled:n,class:[`${o}-base-close`,r&&`${o}-base-close--absolute`,n&&`${o}-base-close--disabled`,t&&`${o}-base-close--round`],onMousedown:i=>{e.focusable||i.preventDefault()},onClick:e.onClick},d(he,{clsPrefix:o},{default:()=>d(ro,null)}))}}}),ao={iconSizeTiny:"28px",iconSizeSmall:"34px",iconSizeMedium:"40px",iconSizeLarge:"46px",iconSizeHuge:"52px"};function co(e){const{textColorDisabled:o,iconColor:n,textColor2:r,fontSizeTiny:t,fontSizeSmall:s,fontSizeMedium:f,fontSizeLarge:i,fontSizeHuge:g}=e;return Object.assign(Object.assign({},ao),{fontSizeTiny:t,fontSizeSmall:s,fontSizeMedium:f,fontSizeLarge:i,fontSizeHuge:g,textColor:o,iconColor:n,extraTextColor:r})}const io={name:"Empty",common:ge,self:co},uo=oe("empty",`
 display: flex;
 flex-direction: column;
 align-items: center;
 font-size: var(--n-font-size);
`,[I("icon",`
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 line-height: var(--n-icon-size);
 color: var(--n-icon-color);
 transition:
 color .3s var(--n-bezier);
 `,[C("+",[I("description",`
 margin-top: 8px;
 `)])]),I("description",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),I("extra",`
 text-align: center;
 transition: color .3s var(--n-bezier);
 margin-top: 12px;
 color: var(--n-extra-text-color);
 `)]),fo=Object.assign(Object.assign({},O.props),{description:String,showDescription:{type:Boolean,default:!0},showIcon:{type:Boolean,default:!0},size:{type:String,default:"medium"},renderIcon:Function}),Do=P({name:"Empty",props:fo,slots:Object,setup(e){const{mergedClsPrefixRef:o,inlineThemeDisabled:n,mergedComponentPropsRef:r}=be(e),t=O("Empty","-empty",uo,io,e,o),{localeRef:s}=qe("Empty"),f=S(()=>{var h,b,y;return(h=e.description)!==null&&h!==void 0?h:(y=(b=r==null?void 0:r.value)===null||b===void 0?void 0:b.Empty)===null||y===void 0?void 0:y.description}),i=S(()=>{var h,b;return((b=(h=r==null?void 0:r.value)===null||h===void 0?void 0:h.Empty)===null||b===void 0?void 0:b.renderIcon)||(()=>d(to,null))}),g=S(()=>{const{size:h}=e,{common:{cubicBezierEaseInOut:b},self:{[m("iconSize",h)]:y,[m("fontSize",h)]:x,textColor:z,iconColor:c,extraTextColor:l}}=t.value;return{"--n-icon-size":y,"--n-font-size":x,"--n-bezier":b,"--n-text-color":z,"--n-icon-color":c,"--n-extra-text-color":l}}),p=n?ve("empty",S(()=>{let h="";const{size:b}=e;return h+=b[0],h}),g,e):void 0;return{mergedClsPrefix:o,mergedRenderIcon:i,localizedDescription:S(()=>f.value||s.value.description),cssVars:n?void 0:g,themeClass:p==null?void 0:p.themeClass,onRender:p==null?void 0:p.onRender}},render(){const{$slots:e,mergedClsPrefix:o,onRender:n}=this;return n==null||n(),d("div",{class:[`${o}-empty`,this.themeClass],style:this.cssVars},this.showIcon?d("div",{class:`${o}-empty__icon`},e.icon?e.icon():d(he,{clsPrefix:o},{default:this.mergedRenderIcon})):null,this.showDescription?d("div",{class:`${o}-empty__description`},e.default?e.default():this.localizedDescription):null,e.extra?d("div",{class:`${o}-empty__extra`},e.extra()):null)}}),{cubicBezierEaseIn:ie,cubicBezierEaseOut:de}=Xe;function Ao({transformOrigin:e="inherit",duration:o=".2s",enterScale:n=".9",originalTransform:r="",originalTransition:t=""}={}){return[C("&.fade-in-scale-up-transition-leave-active",{transformOrigin:e,transition:`opacity ${o} ${ie}, transform ${o} ${ie} ${t&&`,${t}`}`}),C("&.fade-in-scale-up-transition-enter-active",{transformOrigin:e,transition:`opacity ${o} ${de}, transform ${o} ${de} ${t&&`,${t}`}`}),C("&.fade-in-scale-up-transition-enter-from, &.fade-in-scale-up-transition-leave-to",{opacity:0,transform:`${r} scale(${n})`}),C("&.fade-in-scale-up-transition-leave-from, &.fade-in-scale-up-transition-enter-to",{opacity:1,transform:`${r} scale(1)`})]}const ho={closeIconSizeTiny:"12px",closeIconSizeSmall:"12px",closeIconSizeMedium:"14px",closeIconSizeLarge:"14px",closeSizeTiny:"16px",closeSizeSmall:"16px",closeSizeMedium:"18px",closeSizeLarge:"18px",padding:"0 7px",closeMargin:"0 0 0 4px"};function go(e){const{textColor2:o,primaryColorHover:n,primaryColorPressed:r,primaryColor:t,infoColor:s,successColor:f,warningColor:i,errorColor:g,baseColor:p,borderColor:h,opacityDisabled:b,tagColor:y,closeIconColor:x,closeIconColorHover:z,closeIconColorPressed:c,borderRadiusSmall:l,fontSizeMini:a,fontSizeTiny:v,fontSizeSmall:$,fontSizeMedium:T,heightMini:V,heightTiny:D,heightSmall:A,heightMedium:W,closeColorHover:K,closeColorPressed:U,buttonColor2Hover:q,buttonColor2Pressed:X,fontWeightStrong:Y}=e;return Object.assign(Object.assign({},ho),{closeBorderRadius:l,heightTiny:V,heightSmall:D,heightMedium:A,heightLarge:W,borderRadius:l,opacityDisabled:b,fontSizeTiny:a,fontSizeSmall:v,fontSizeMedium:$,fontSizeLarge:T,fontWeightStrong:Y,textColorCheckable:o,textColorHoverCheckable:o,textColorPressedCheckable:o,textColorChecked:p,colorCheckable:"#0000",colorHoverCheckable:q,colorPressedCheckable:X,colorChecked:t,colorCheckedHover:n,colorCheckedPressed:r,border:`1px solid ${h}`,textColor:o,color:y,colorBordered:"rgb(250, 250, 252)",closeIconColor:x,closeIconColorHover:z,closeIconColorPressed:c,closeColorHover:K,closeColorPressed:U,borderPrimary:`1px solid ${u(t,{alpha:.3})}`,textColorPrimary:t,colorPrimary:u(t,{alpha:.12}),colorBorderedPrimary:u(t,{alpha:.1}),closeIconColorPrimary:t,closeIconColorHoverPrimary:t,closeIconColorPressedPrimary:t,closeColorHoverPrimary:u(t,{alpha:.12}),closeColorPressedPrimary:u(t,{alpha:.18}),borderInfo:`1px solid ${u(s,{alpha:.3})}`,textColorInfo:s,colorInfo:u(s,{alpha:.12}),colorBorderedInfo:u(s,{alpha:.1}),closeIconColorInfo:s,closeIconColorHoverInfo:s,closeIconColorPressedInfo:s,closeColorHoverInfo:u(s,{alpha:.12}),closeColorPressedInfo:u(s,{alpha:.18}),borderSuccess:`1px solid ${u(f,{alpha:.3})}`,textColorSuccess:f,colorSuccess:u(f,{alpha:.12}),colorBorderedSuccess:u(f,{alpha:.1}),closeIconColorSuccess:f,closeIconColorHoverSuccess:f,closeIconColorPressedSuccess:f,closeColorHoverSuccess:u(f,{alpha:.12}),closeColorPressedSuccess:u(f,{alpha:.18}),borderWarning:`1px solid ${u(i,{alpha:.35})}`,textColorWarning:i,colorWarning:u(i,{alpha:.15}),colorBorderedWarning:u(i,{alpha:.12}),closeIconColorWarning:i,closeIconColorHoverWarning:i,closeIconColorPressedWarning:i,closeColorHoverWarning:u(i,{alpha:.12}),closeColorPressedWarning:u(i,{alpha:.18}),borderError:`1px solid ${u(g,{alpha:.23})}`,textColorError:g,colorError:u(g,{alpha:.1}),colorBorderedError:u(g,{alpha:.08}),closeIconColorError:g,closeIconColorHoverError:g,closeIconColorPressedError:g,closeColorHoverError:u(g,{alpha:.12}),closeColorPressedError:u(g,{alpha:.18})})}const bo={common:ge,self:go},vo={color:Object,type:{type:String,default:"default"},round:Boolean,size:String,closable:Boolean,disabled:{type:Boolean,default:void 0}},po=oe("tag",`
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
`,[k("strong",`
 font-weight: var(--n-font-weight-strong);
 `),I("border",`
 pointer-events: none;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 border-radius: inherit;
 border: var(--n-border);
 transition: border-color .3s var(--n-bezier);
 `),I("icon",`
 display: flex;
 margin: 0 4px 0 0;
 color: var(--n-text-color);
 transition: color .3s var(--n-bezier);
 font-size: var(--n-avatar-size-override);
 `),I("avatar",`
 display: flex;
 margin: 0 6px 0 0;
 `),I("close",`
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `),k("round",`
 padding: 0 calc(var(--n-height) / 3);
 border-radius: calc(var(--n-height) / 2);
 `,[I("icon",`
 margin: 0 4px 0 calc((var(--n-height) - 8px) / -2);
 `),I("avatar",`
 margin: 0 6px 0 calc((var(--n-height) - 8px) / -2);
 `),k("closable",`
 padding: 0 calc(var(--n-height) / 4) 0 calc(var(--n-height) / 3);
 `)]),k("icon, avatar",[k("round",`
 padding: 0 calc(var(--n-height) / 3) 0 calc(var(--n-height) / 2);
 `)]),k("disabled",`
 cursor: not-allowed !important;
 opacity: var(--n-opacity-disabled);
 `),k("checkable",`
 cursor: pointer;
 box-shadow: none;
 color: var(--n-text-color-checkable);
 background-color: var(--n-color-checkable);
 `,[L("disabled",[C("&:hover","background-color: var(--n-color-hover-checkable);",[L("checked","color: var(--n-text-color-hover-checkable);")]),C("&:active","background-color: var(--n-color-pressed-checkable);",[L("checked","color: var(--n-text-color-pressed-checkable);")])]),k("checked",`
 color: var(--n-text-color-checked);
 background-color: var(--n-color-checked);
 `,[L("disabled",[C("&:hover","background-color: var(--n-color-checked-hover);"),C("&:active","background-color: var(--n-color-checked-pressed);")])])])]),Co=Object.assign(Object.assign(Object.assign({},O.props),vo),{bordered:{type:Boolean,default:void 0},checked:Boolean,checkable:Boolean,strong:Boolean,triggerClickOnClose:Boolean,onClose:[Array,Function],onMouseenter:Function,onMouseleave:Function,"onUpdate:checked":Function,onUpdateChecked:Function,internalCloseFocusable:{type:Boolean,default:!0},internalCloseIsButtonTag:{type:Boolean,default:!0},onCheckedChange:Function}),mo=B("n-tag"),Wo=P({name:"Tag",props:Co,slots:Object,setup(e){const o=_(null),{mergedBorderedRef:n,mergedClsPrefixRef:r,inlineThemeDisabled:t,mergedRtlRef:s,mergedComponentPropsRef:f}=be(e),i=S(()=>{var c,l;return e.size||((l=(c=f==null?void 0:f.value)===null||c===void 0?void 0:c.Tag)===null||l===void 0?void 0:l.size)||"medium"}),g=O("Tag","-tag",po,bo,e,r);Ae(mo,{roundRef:ee(e,"round")});function p(){if(!e.disabled&&e.checkable){const{checked:c,onCheckedChange:l,onUpdateChecked:a,"onUpdate:checked":v}=e;a&&a(!c),v&&v(!c),l&&l(!c)}}function h(c){if(e.triggerClickOnClose||c.stopPropagation(),!e.disabled){const{onClose:l}=e;l&&Ge(l,c)}}const b={setTextContent(c){const{value:l}=o;l&&(l.textContent=c)}},y=Ye("Tag",s,r),x=S(()=>{const{type:c,color:{color:l,textColor:a}={}}=e,v=i.value,{common:{cubicBezierEaseInOut:$},self:{padding:T,closeMargin:V,borderRadius:D,opacityDisabled:A,textColorCheckable:W,textColorHoverCheckable:K,textColorPressedCheckable:U,textColorChecked:q,colorCheckable:X,colorHoverCheckable:Y,colorPressedCheckable:ze,colorChecked:ke,colorCheckedHover:Ie,colorCheckedPressed:Se,closeBorderRadius:$e,fontWeightStrong:Ee,[m("colorBordered",c)]:we,[m("closeSize",v)]:Pe,[m("closeIconSize",v)]:Be,[m("fontSize",v)]:Te,[m("height",v)]:ne,[m("color",c)]:Fe,[m("textColor",c)]:Le,[m("border",c)]:He,[m("closeIconColor",c)]:re,[m("closeIconColorHover",c)]:Re,[m("closeIconColorPressed",c)]:Me,[m("closeColorHover",c)]:_e,[m("closeColorPressed",c)]:je}}=g.value,R=Je(V);return{"--n-font-weight-strong":Ee,"--n-avatar-size-override":`calc(${ne} - 8px)`,"--n-bezier":$,"--n-border-radius":D,"--n-border":He,"--n-close-icon-size":Be,"--n-close-color-pressed":je,"--n-close-color-hover":_e,"--n-close-border-radius":$e,"--n-close-icon-color":re,"--n-close-icon-color-hover":Re,"--n-close-icon-color-pressed":Me,"--n-close-icon-color-disabled":re,"--n-close-margin-top":R.top,"--n-close-margin-right":R.right,"--n-close-margin-bottom":R.bottom,"--n-close-margin-left":R.left,"--n-close-size":Pe,"--n-color":l||(n.value?we:Fe),"--n-color-checkable":X,"--n-color-checked":ke,"--n-color-checked-hover":Ie,"--n-color-checked-pressed":Se,"--n-color-hover-checkable":Y,"--n-color-pressed-checkable":ze,"--n-font-size":Te,"--n-height":ne,"--n-opacity-disabled":A,"--n-padding":T,"--n-text-color":a||Le,"--n-text-color-checkable":W,"--n-text-color-checked":q,"--n-text-color-hover-checkable":K,"--n-text-color-pressed-checkable":U}}),z=t?ve("tag",S(()=>{let c="";const{type:l,color:{color:a,textColor:v}={}}=e;return c+=l[0],c+=i.value[0],a&&(c+=`a${se(a)}`),v&&(c+=`b${se(v)}`),n.value&&(c+="c"),c}),x,e):void 0;return Object.assign(Object.assign({},b),{rtlEnabled:y,mergedClsPrefix:r,contentRef:o,mergedBordered:n,handleClick:p,handleCloseClick:h,cssVars:t?void 0:x,themeClass:z==null?void 0:z.themeClass,onRender:z==null?void 0:z.onRender})},render(){var e,o;const{mergedClsPrefix:n,rtlEnabled:r,closable:t,color:{borderColor:s}={},round:f,onRender:i,$slots:g}=this;i==null||i();const p=le(g.avatar,b=>b&&d("div",{class:`${n}-tag__avatar`},b)),h=le(g.icon,b=>b&&d("div",{class:`${n}-tag__icon`},b));return d("div",{class:[`${n}-tag`,this.themeClass,{[`${n}-tag--rtl`]:r,[`${n}-tag--strong`]:this.strong,[`${n}-tag--disabled`]:this.disabled,[`${n}-tag--checkable`]:this.checkable,[`${n}-tag--checked`]:this.checkable&&this.checked,[`${n}-tag--round`]:f,[`${n}-tag--avatar`]:p,[`${n}-tag--icon`]:h,[`${n}-tag--closable`]:t}],style:this.cssVars,onClick:this.handleClick,onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave},h||p,d("span",{class:`${n}-tag__content`,ref:"contentRef"},(o=(e=this.$slots).default)===null||o===void 0?void 0:o.call(e)),!this.checkable&&t?d(so,{clsPrefix:n,class:`${n}-tag__close`,disabled:this.disabled,onClick:this.handleCloseClick,focusable:this.internalCloseFocusable,round:f,isButtonTag:this.internalCloseIsButtonTag,absolute:!0}):null,!this.checkable&&this.mergedBordered?d("div",{class:`${n}-tag__border`,style:{borderColor:s}}):null)}});export{Ro as F,Ho as L,Do as N,Wo as a,so as b,Fo as c,Eo as d,$o as e,Ao as f,Zo as g,Io as h,So as i,wo as j,Oo as k,_o as l,Po as m,Z as n,ae as o,Bo as p,To as q,Vo as r,io as s,jo as t,Mo as u,Lo as z};
