import{bx as F,aI as L,bY as Ce,aG as K,bD as ke,G as v,H as Ae,I as g,d as z,J as l,T as G,au as ze,av as Se,K as D,L as W,M as Q,p as w,i as I,as as j,bZ as Y,F as V,bA as Re,aU as O,b_ as Le,a2 as Pe,b$ as je,bJ as Z,c0 as Oe,c1 as Ee,c2 as $e,bl as ee,a4 as te,c3 as Be,c4 as _e,b4 as Ie,O as Ne,c5 as $,af as Me,bS as He,aR as Te,U as Fe,bT as Ke,bI as De,ai as We,ah as qe,aj as Ve,ag as Ue,bK as Xe,ap as Je,E as b,aJ as R,c6 as Ge,ao as Qe,u as X,c7 as Ye,c8 as Ze,bN as et,bc as tt,c9 as nt,ca as it,cb as ot}from"./index-DOpmA-0U.js";function rt(){const e=L(Ce,null);return e===null&&F("use-dialog","No outer <n-dialog-provider /> founded."),e}const ne=K("n-loading-bar"),ie=K("n-loading-bar-api");function at(e){const{primaryColor:t,errorColor:n}=e;return{colorError:n,colorLoading:t,height:"2px"}}const st={common:ke,self:at},lt=v("loading-bar-container",`
 z-index: 5999;
 position: fixed;
 top: 0;
 left: 0;
 right: 0;
 height: 2px;
`,[Ae({enterDuration:"0.3s",leaveDuration:"0.8s"}),v("loading-bar",`
 width: 100%;
 transition:
 max-width 4s linear,
 background .2s linear;
 height: var(--n-height);
 `,[g("starting",`
 background: var(--n-color-loading);
 `),g("finishing",`
 background: var(--n-color-loading);
 transition:
 max-width .2s linear,
 background .2s linear;
 `),g("error",`
 background: var(--n-color-error);
 transition:
 max-width .2s linear,
 background .2s linear;
 `)])]);var N=function(e,t,n,i){function r(o){return o instanceof n?o:new n(function(a){a(o)})}return new(n||(n=Promise))(function(o,a){function d(f){try{u(i.next(f))}catch(h){a(h)}}function c(f){try{u(i.throw(f))}catch(h){a(h)}}function u(f){f.done?o(f.value):r(f.value).then(d,c)}u((i=i.apply(e,t||[])).next())})};function M(e,t){return`${t}-loading-bar ${t}-loading-bar--${e}`}const ct=z({name:"LoadingBar",props:{containerClass:String,containerStyle:[String,Object]},setup(){const{inlineThemeDisabled:e}=D(),{props:t,mergedClsPrefixRef:n}=L(ne),i=w(null),r=w(!1),o=w(!1),a=w(!1),d=w(!1);let c=!1;const u=w(!1),f=I(()=>{const{loadingBarStyle:p}=t;return p?p[u.value?"error":"loading"]:""});function h(){return N(this,void 0,void 0,function*(){r.value=!1,a.value=!1,c=!1,u.value=!1,d.value=!0,yield j(),d.value=!1})}function x(){return N(this,arguments,void 0,function*(p=0,B=80,_="starting"){if(o.value=!0,yield h(),c)return;a.value=!0,yield j();const A=i.value;A&&(A.style.maxWidth=`${p}%`,A.style.transition="none",A.offsetWidth,A.className=M(_,n.value),A.style.transition="",A.style.maxWidth=`${B}%`)})}function y(){return N(this,void 0,void 0,function*(){if(c||u.value)return;o.value&&(yield j()),c=!0;const p=i.value;p&&(p.className=M("finishing",n.value),p.style.maxWidth="100%",p.offsetWidth,a.value=!1)})}function s(){if(!(c||u.value))if(!a.value)x(100,100,"error").then(()=>{u.value=!0;const p=i.value;p&&(p.className=M("error",n.value),p.offsetWidth,a.value=!1)});else{u.value=!0;const p=i.value;if(!p)return;p.className=M("error",n.value),p.style.maxWidth="100%",p.offsetWidth,a.value=!1}}function m(){r.value=!0}function C(){r.value=!1}function S(){return N(this,void 0,void 0,function*(){yield h()})}const E=W("LoadingBar","-loading-bar",lt,st,t,n),P=I(()=>{const{self:{height:p,colorError:B,colorLoading:_}}=E.value;return{"--n-height":p,"--n-color-loading":_,"--n-color-error":B}}),k=e?Q("loading-bar",void 0,P,t):void 0;return{mergedClsPrefix:n,loadingBarRef:i,started:o,loading:a,entering:r,transitionDisabled:d,start:x,error:s,finish:y,handleEnter:m,handleAfterEnter:C,handleAfterLeave:S,mergedLoadingBarStyle:f,cssVars:e?void 0:P,themeClass:k==null?void 0:k.themeClass,onRender:k==null?void 0:k.onRender}},render(){if(!this.started)return null;const{mergedClsPrefix:e}=this;return l(G,{name:"fade-in-transition",appear:!0,onEnter:this.handleEnter,onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave,css:!this.transitionDisabled},{default:()=>{var t;return(t=this.onRender)===null||t===void 0||t.call(this),ze(l("div",{class:[`${e}-loading-bar-container`,this.themeClass,this.containerClass],style:this.containerStyle},l("div",{ref:"loadingBarRef",class:[`${e}-loading-bar`],style:[this.cssVars,this.mergedLoadingBarStyle]})),[[Se,this.loading||!this.loading&&this.entering]])}})}}),dt=Object.assign(Object.assign({},W.props),{to:{type:[String,Object,Boolean],default:void 0},containerClass:String,containerStyle:[String,Object],loadingBarStyle:{type:Object}}),ft=z({name:"LoadingBarProvider",props:dt,setup(e){const t=Re(),n=w(null),i={start(){var o;t.value?(o=n.value)===null||o===void 0||o.start():j(()=>{var a;(a=n.value)===null||a===void 0||a.start()})},error(){var o;t.value?(o=n.value)===null||o===void 0||o.error():j(()=>{var a;(a=n.value)===null||a===void 0||a.error()})},finish(){var o;t.value?(o=n.value)===null||o===void 0||o.finish():j(()=>{var a;(a=n.value)===null||a===void 0||a.finish()})}},{mergedClsPrefixRef:r}=D(e);return O(ie,i),O(ne,{props:e,mergedClsPrefixRef:r}),Object.assign(i,{loadingBarRef:n})},render(){var e,t;return l(V,null,l(Y,{disabled:this.to===!1,to:this.to||"body"},l(ct,{ref:"loadingBarRef",containerStyle:this.containerStyle,containerClass:this.containerClass})),(t=(e=this.$slots).default)===null||t===void 0?void 0:t.call(e))}});function ut(){const e=L(ie,null);return e===null&&F("use-loading-bar","No outer <n-loading-bar-provider /> founded."),e}function vt(){const e=L(Le,null);return e===null&&F("use-message","No outer <n-message-provider /> founded. See prerequisite in https://www.naiveui.com/en-US/os-theme/components/message for more details. If you want to use `useMessage` outside setup, please check https://www.naiveui.com/zh-CN/os-theme/components/message#Q-&-A."),e}const ht=z({name:"ModalEnvironment",props:Object.assign(Object.assign({},je),{internalKey:{type:String,required:!0},onInternalAfterLeave:{type:Function,required:!0}}),setup(e){const t=w(!0);function n(){const{onInternalAfterLeave:f,internalKey:h,onAfterLeave:x}=e;f&&f(h),x&&x()}function i(){const{onPositiveClick:f}=e;f?Promise.resolve(f()).then(h=>{h!==!1&&c()}):c()}function r(){const{onNegativeClick:f}=e;f?Promise.resolve(f()).then(h=>{h!==!1&&c()}):c()}function o(){const{onClose:f}=e;f?Promise.resolve(f()).then(h=>{h!==!1&&c()}):c()}function a(f){const{onMaskClick:h,maskClosable:x}=e;h&&(h(f),x&&c())}function d(){const{onEsc:f}=e;f&&f()}function c(){t.value=!1}function u(f){t.value=f}return{show:t,hide:c,handleUpdateShow:u,handleAfterLeave:n,handleCloseClick:o,handleNegativeClick:r,handlePositiveClick:i,handleMaskClick:a,handleEsc:d}},render(){const{handleUpdateShow:e,handleAfterLeave:t,handleMaskClick:n,handleEsc:i,show:r}=this;return l(Pe,Object.assign({},this.$props,{show:r,onUpdateShow:e,onMaskClick:n,onEsc:i,onAfterLeave:t,internalAppear:!0,internalModal:!0}),this.$slots)}}),pt={to:[String,Object]},gt=z({name:"ModalProvider",props:pt,setup(){const e=w([]),t={};function n(a={}){const d=ee(),c=te(Object.assign(Object.assign({},a),{key:d,destroy:()=>{var u;(u=t[`n-modal-${d}`])===null||u===void 0||u.hide()}}));return e.value.push(c),c}function i(a){const{value:d}=e;d.splice(d.findIndex(c=>c.key===a),1)}function r(){Object.values(t).forEach(a=>{a==null||a.hide()})}const o={create:n,destroyAll:r};return O(Be,o),O($e,{clickedRef:Ee(64),clickedPositionRef:Oe()}),O(_e,e),Object.assign(Object.assign({},o),{modalList:e,modalInstRefs:t,handleAfterLeave:i})},render(){var e,t;return l(V,null,[this.modalList.map(n=>{var i;return l(ht,Z(n,["destroy","render"],{to:(i=n.to)!==null&&i!==void 0?i:this.to,ref:r=>{r===null?delete this.modalInstRefs[`n-modal-${n.key}`]:this.modalInstRefs[`n-modal-${n.key}`]=r},internalKey:n.key,onInternalAfterLeave:this.handleAfterLeave}),{default:n.render})}),(t=(e=this.$slots).default)===null||t===void 0?void 0:t.call(e)])}}),q=K("n-notification-provider"),mt=z({name:"NotificationContainer",props:{scrollable:{type:Boolean,required:!0},placement:{type:String,required:!0}},setup(){const{mergedThemeRef:e,mergedClsPrefixRef:t,wipTransitionCountRef:n}=L(q),i=w(null);return Ne(()=>{var r,o;n.value>0?(r=i==null?void 0:i.value)===null||r===void 0||r.classList.add("transitioning"):(o=i==null?void 0:i.value)===null||o===void 0||o.classList.remove("transitioning")}),{selfRef:i,mergedTheme:e,mergedClsPrefix:t,transitioning:n}},render(){const{$slots:e,scrollable:t,mergedClsPrefix:n,mergedTheme:i,placement:r}=this;return l("div",{ref:"selfRef",class:[`${n}-notification-container`,t&&`${n}-notification-container--scrollable`,`${n}-notification-container--${r}`]},t?l(Ie,{theme:i.peers.Scrollbar,themeOverrides:i.peerOverrides.Scrollbar,contentStyle:{overflow:"hidden"}},e):e)}}),bt={info:()=>l(Ue,null),success:()=>l(Ve,null),warning:()=>l(qe,null),error:()=>l(We,null),default:()=>null},U={closable:{type:Boolean,default:!0},type:{type:String,default:"default"},avatar:Function,title:[String,Function],description:[String,Function],content:[String,Function],meta:[String,Function],action:[String,Function],onClose:{type:Function,required:!0},keepAliveOnHover:Boolean,onMouseenter:Function,onMouseleave:Function},yt=De(U),xt=z({name:"Notification",props:U,setup(e){const{mergedClsPrefixRef:t,mergedThemeRef:n,props:i}=L(q),{inlineThemeDisabled:r,mergedRtlRef:o}=D(),a=Te("Notification",o,t),d=I(()=>{const{type:u}=e,{self:{color:f,textColor:h,closeIconColor:x,closeIconColorHover:y,closeIconColorPressed:s,headerTextColor:m,descriptionTextColor:C,actionTextColor:S,borderRadius:E,headerFontWeight:P,boxShadow:k,lineHeight:p,fontSize:B,closeMargin:_,closeSize:A,width:re,padding:ae,closeIconSize:se,closeBorderRadius:le,closeColorHover:ce,closeColorPressed:de,titleFontSize:fe,metaFontSize:ue,descriptionFontSize:ve,[Fe("iconColor",u)]:he},common:{cubicBezierEaseOut:pe,cubicBezierEaseIn:ge,cubicBezierEaseInOut:me}}=n.value,{left:be,right:ye,top:xe,bottom:we}=Ke(ae);return{"--n-color":f,"--n-font-size":B,"--n-text-color":h,"--n-description-text-color":C,"--n-action-text-color":S,"--n-title-text-color":m,"--n-title-font-weight":P,"--n-bezier":me,"--n-bezier-ease-out":pe,"--n-bezier-ease-in":ge,"--n-border-radius":E,"--n-box-shadow":k,"--n-close-border-radius":le,"--n-close-color-hover":ce,"--n-close-color-pressed":de,"--n-close-icon-color":x,"--n-close-icon-color-hover":y,"--n-close-icon-color-pressed":s,"--n-line-height":p,"--n-icon-color":he,"--n-close-margin":_,"--n-close-size":A,"--n-close-icon-size":se,"--n-width":re,"--n-padding-left":be,"--n-padding-right":ye,"--n-padding-top":xe,"--n-padding-bottom":we,"--n-title-font-size":fe,"--n-meta-font-size":ue,"--n-description-font-size":ve}}),c=r?Q("notification",I(()=>e.type[0]),d,i):void 0;return{mergedClsPrefix:t,showAvatar:I(()=>e.avatar||e.type!=="default"),handleCloseClick(){e.onClose()},rtlEnabled:a,cssVars:r?void 0:d,themeClass:c==null?void 0:c.themeClass,onRender:c==null?void 0:c.onRender}},render(){var e;const{mergedClsPrefix:t}=this;return(e=this.onRender)===null||e===void 0||e.call(this),l("div",{class:[`${t}-notification-wrapper`,this.themeClass],onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave,style:this.cssVars},l("div",{class:[`${t}-notification`,this.rtlEnabled&&`${t}-notification--rtl`,this.themeClass,{[`${t}-notification--closable`]:this.closable,[`${t}-notification--show-avatar`]:this.showAvatar}],style:this.cssVars},this.showAvatar?l("div",{class:`${t}-notification__avatar`},this.avatar?$(this.avatar):this.type!=="default"?l(Me,{clsPrefix:t},{default:()=>bt[this.type]()}):null):null,this.closable?l(He,{clsPrefix:t,class:`${t}-notification__close`,onClick:this.handleCloseClick}):null,l("div",{ref:"bodyRef",class:`${t}-notification-main`},this.title?l("div",{class:`${t}-notification-main__header`},$(this.title)):null,this.description?l("div",{class:`${t}-notification-main__description`},$(this.description)):null,this.content?l("pre",{class:`${t}-notification-main__content`},$(this.content)):null,this.meta||this.action?l("div",{class:`${t}-notification-main-footer`},this.meta?l("div",{class:`${t}-notification-main-footer__meta`},$(this.meta)):null,this.action?l("div",{class:`${t}-notification-main-footer__action`},$(this.action)):null):null)))}}),wt=Object.assign(Object.assign({},U),{duration:Number,onClose:Function,onLeave:Function,onAfterEnter:Function,onAfterLeave:Function,onHide:Function,onAfterShow:Function,onAfterHide:Function}),Ct=z({name:"NotificationEnvironment",props:Object.assign(Object.assign({},wt),{internalKey:{type:String,required:!0},onInternalAfterLeave:{type:Function,required:!0}}),setup(e){const{wipTransitionCountRef:t}=L(q),n=w(!0);let i=null;function r(){n.value=!1,i&&window.clearTimeout(i)}function o(s){t.value++,j(()=>{s.style.height=`${s.offsetHeight}px`,s.style.maxHeight="0",s.style.transition="none",s.offsetHeight,s.style.transition="",s.style.maxHeight=s.style.height})}function a(s){t.value--,s.style.height="",s.style.maxHeight="";const{onAfterEnter:m,onAfterShow:C}=e;m&&m(),C&&C()}function d(s){t.value++,s.style.maxHeight=`${s.offsetHeight}px`,s.style.height=`${s.offsetHeight}px`,s.offsetHeight}function c(s){const{onHide:m}=e;m&&m(),s.style.maxHeight="0",s.offsetHeight}function u(){t.value--;const{onAfterLeave:s,onInternalAfterLeave:m,onAfterHide:C,internalKey:S}=e;s&&s(),m(S),C&&C()}function f(){const{duration:s}=e;s&&(i=window.setTimeout(r,s))}function h(s){s.currentTarget===s.target&&i!==null&&(window.clearTimeout(i),i=null)}function x(s){s.currentTarget===s.target&&f()}function y(){const{onClose:s}=e;s?Promise.resolve(s()).then(m=>{m!==!1&&r()}):r()}return Je(()=>{e.duration&&(i=window.setTimeout(r,e.duration))}),{show:n,hide:r,handleClose:y,handleAfterLeave:u,handleLeave:c,handleBeforeLeave:d,handleAfterEnter:a,handleBeforeEnter:o,handleMouseenter:h,handleMouseleave:x}},render(){return l(G,{name:"notification-transition",appear:!0,onBeforeEnter:this.handleBeforeEnter,onAfterEnter:this.handleAfterEnter,onBeforeLeave:this.handleBeforeLeave,onLeave:this.handleLeave,onAfterLeave:this.handleAfterLeave},{default:()=>this.show?l(xt,Object.assign({},Xe(this.$props,yt),{onClose:this.handleClose,onMouseenter:this.duration&&this.keepAliveOnHover?this.handleMouseenter:void 0,onMouseleave:this.duration&&this.keepAliveOnHover?this.handleMouseleave:void 0})):null})}}),kt=b([v("notification-container",`
 z-index: 4000;
 position: fixed;
 overflow: visible;
 display: flex;
 flex-direction: column;
 align-items: flex-end;
 `,[b(">",[v("scrollbar",`
 width: initial;
 overflow: visible;
 height: -moz-fit-content !important;
 height: fit-content !important;
 max-height: 100vh !important;
 `,[b(">",[v("scrollbar-container",`
 height: -moz-fit-content !important;
 height: fit-content !important;
 max-height: 100vh !important;
 `,[v("scrollbar-content",`
 padding-top: 12px;
 padding-bottom: 33px;
 `)])])])]),g("top, top-right, top-left",`
 top: 12px;
 `,[b("&.transitioning >",[v("scrollbar",[b(">",[v("scrollbar-container",`
 min-height: 100vh !important;
 `)])])])]),g("bottom, bottom-right, bottom-left",`
 bottom: 12px;
 `,[b(">",[v("scrollbar",[b(">",[v("scrollbar-container",[v("scrollbar-content",`
 padding-bottom: 12px;
 `)])])])]),v("notification-wrapper",`
 display: flex;
 align-items: flex-end;
 margin-bottom: 0;
 margin-top: 12px;
 `)]),g("top, bottom",`
 left: 50%;
 transform: translateX(-50%);
 `,[v("notification-wrapper",[b("&.notification-transition-enter-from, &.notification-transition-leave-to",`
 transform: scale(0.85);
 `),b("&.notification-transition-leave-from, &.notification-transition-enter-to",`
 transform: scale(1);
 `)])]),g("top",[v("notification-wrapper",`
 transform-origin: top center;
 `)]),g("bottom",[v("notification-wrapper",`
 transform-origin: bottom center;
 `)]),g("top-right, bottom-right",[v("notification",`
 margin-left: 28px;
 margin-right: 16px;
 `)]),g("top-left, bottom-left",[v("notification",`
 margin-left: 16px;
 margin-right: 28px;
 `)]),g("top-right",`
 right: 0;
 `,[H("top-right")]),g("top-left",`
 left: 0;
 `,[H("top-left")]),g("bottom-right",`
 right: 0;
 `,[H("bottom-right")]),g("bottom-left",`
 left: 0;
 `,[H("bottom-left")]),g("scrollable",[g("top-right",`
 top: 0;
 `),g("top-left",`
 top: 0;
 `),g("bottom-right",`
 bottom: 0;
 `),g("bottom-left",`
 bottom: 0;
 `)]),v("notification-wrapper",`
 margin-bottom: 12px;
 `,[b("&.notification-transition-enter-from, &.notification-transition-leave-to",`
 opacity: 0;
 margin-top: 0 !important;
 margin-bottom: 0 !important;
 `),b("&.notification-transition-leave-from, &.notification-transition-enter-to",`
 opacity: 1;
 `),b("&.notification-transition-leave-active",`
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 transform .3s var(--n-bezier-ease-in),
 max-height .3s var(--n-bezier),
 margin-top .3s linear,
 margin-bottom .3s linear,
 box-shadow .3s var(--n-bezier);
 `),b("&.notification-transition-enter-active",`
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 transform .3s var(--n-bezier-ease-out),
 max-height .3s var(--n-bezier),
 margin-top .3s linear,
 margin-bottom .3s linear,
 box-shadow .3s var(--n-bezier);
 `)]),v("notification",`
 background-color: var(--n-color);
 color: var(--n-text-color);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 font-family: inherit;
 font-size: var(--n-font-size);
 font-weight: 400;
 position: relative;
 display: flex;
 overflow: hidden;
 flex-shrink: 0;
 padding-left: var(--n-padding-left);
 padding-right: var(--n-padding-right);
 width: var(--n-width);
 max-width: calc(100vw - 16px - 16px);
 border-radius: var(--n-border-radius);
 box-shadow: var(--n-box-shadow);
 box-sizing: border-box;
 opacity: 1;
 `,[R("avatar",[v("icon",`
 color: var(--n-icon-color);
 `),v("base-icon",`
 color: var(--n-icon-color);
 `)]),g("show-avatar",[v("notification-main",`
 margin-left: 40px;
 width: calc(100% - 40px); 
 `)]),g("closable",[v("notification-main",[b("> *:first-child",`
 padding-right: 20px;
 `)]),R("close",`
 position: absolute;
 top: 0;
 right: 0;
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `)]),R("avatar",`
 position: absolute;
 top: var(--n-padding-top);
 left: var(--n-padding-left);
 width: 28px;
 height: 28px;
 font-size: 28px;
 display: flex;
 align-items: center;
 justify-content: center;
 `,[v("icon","transition: color .3s var(--n-bezier);")]),v("notification-main",`
 padding-top: var(--n-padding-top);
 padding-bottom: var(--n-padding-bottom);
 box-sizing: border-box;
 display: flex;
 flex-direction: column;
 margin-left: 8px;
 width: calc(100% - 8px);
 `,[v("notification-main-footer",`
 display: flex;
 align-items: center;
 justify-content: space-between;
 margin-top: 12px;
 `,[R("meta",`
 font-size: var(--n-meta-font-size);
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-description-text-color);
 `),R("action",`
 cursor: pointer;
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-action-text-color);
 `)]),R("header",`
 font-weight: var(--n-title-font-weight);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-title-text-color);
 `),R("description",`
 margin-top: 8px;
 font-size: var(--n-description-font-size);
 white-space: pre-wrap;
 word-wrap: break-word;
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-description-text-color);
 `),R("content",`
 line-height: var(--n-line-height);
 margin: 12px 0 0 0;
 font-family: inherit;
 white-space: pre-wrap;
 word-wrap: break-word;
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-text-color);
 `,[b("&:first-child","margin: 0;")])])])])]);function H(e){const n=e.split("-")[1]==="left"?"calc(-100%)":"calc(100%)";return v("notification-wrapper",[b("&.notification-transition-enter-from, &.notification-transition-leave-to",`
 transform: translate(${n}, 0);
 `),b("&.notification-transition-leave-from, &.notification-transition-enter-to",`
 transform: translate(0, 0);
 `)])}const oe=K("n-notification-api"),At=Object.assign(Object.assign({},W.props),{containerClass:String,containerStyle:[String,Object],to:[String,Object],scrollable:{type:Boolean,default:!0},max:Number,placement:{type:String,default:"top-right"},keepAliveOnHover:Boolean}),zt=z({name:"NotificationProvider",props:At,setup(e){const{mergedClsPrefixRef:t}=D(e),n=w([]),i={},r=new Set;function o(y){const s=ee(),m=()=>{r.add(s),i[s]&&i[s].hide()},C=te(Object.assign(Object.assign({},y),{key:s,destroy:m,hide:m,deactivate:m})),{max:S}=e;if(S&&n.value.length-r.size>=S){let E=!1,P=0;for(const k of n.value){if(!r.has(k.key)){i[k.key]&&(k.destroy(),E=!0);break}P++}E||n.value.splice(P,1)}return n.value.push(C),C}const a=["info","success","warning","error"].map(y=>s=>o(Object.assign(Object.assign({},s),{type:y})));function d(y){r.delete(y),n.value.splice(n.value.findIndex(s=>s.key===y),1)}const c=W("Notification","-notification",kt,Ge,e,t),u={create:o,info:a[0],success:a[1],warning:a[2],error:a[3],open:h,destroyAll:x},f=w(0);O(oe,u),O(q,{props:e,mergedClsPrefixRef:t,mergedThemeRef:c,wipTransitionCountRef:f});function h(y){return o(y)}function x(){Object.values(n.value).forEach(y=>{y.hide()})}return Object.assign({mergedClsPrefix:t,notificationList:n,notificationRefs:i,handleAfterLeave:d},u)},render(){var e,t,n;const{placement:i}=this;return l(V,null,(t=(e=this.$slots).default)===null||t===void 0?void 0:t.call(e),this.notificationList.length?l(Y,{to:(n=this.to)!==null&&n!==void 0?n:"body"},l(mt,{class:this.containerClass,style:this.containerStyle,scrollable:this.scrollable&&i!=="top"&&i!=="bottom",placement:i},{default:()=>this.notificationList.map(r=>l(Ct,Object.assign({ref:o=>{const a=r.key;o===null?delete this.notificationRefs[a]:this.notificationRefs[a]=o}},Z(r,["destroy","hide","deactivate"]),{internalKey:r.key,onInternalAfterLeave:this.handleAfterLeave,keepAliveOnHover:r.keepAliveOnHover===void 0?this.keepAliveOnHover:r.keepAliveOnHover})))})):null)}});function St(){const e=L(oe,null);return e===null&&F("use-notification","No outer `n-notification-provider` found."),e}const Rt=z({name:"InjectionExtractor",props:{onSetup:Function},setup(e,{slots:t}){var n;return(n=e.onSetup)===null||n===void 0||n.call(e),()=>{var i;return(i=t.default)===null||i===void 0?void 0:i.call(t)}}}),Lt={message:vt,notification:St,loadingBar:ut,dialog:rt,modal:Ye};function Pt({providersAndProps:e,configProviderProps:t}){let n=Qe(r);const i={app:n};function r(){return l(Ze,X(t),{default:()=>e.map(({type:d,Provider:c,props:u})=>l(c,X(u),{default:()=>l(Rt,{onSetup:()=>i[d]=Lt[d]()})}))})}let o;return et&&(o=document.createElement("div"),document.body.appendChild(o),n.mount(o)),Object.assign({unmount:()=>{var d;if(n===null||o===null){tt("discrete","unmount call no need because discrete app has been unmounted");return}n.unmount(),(d=o.parentNode)===null||d===void 0||d.removeChild(o),o=null,n=null}},i)}function jt(e,{configProviderProps:t,messageProviderProps:n,dialogProviderProps:i,notificationProviderProps:r,loadingBarProviderProps:o,modalProviderProps:a}={}){const d=[];return e.forEach(u=>{switch(u){case"message":d.push({type:u,Provider:it,props:n});break;case"notification":d.push({type:u,Provider:zt,props:r});break;case"dialog":d.push({type:u,Provider:nt,props:i});break;case"loadingBar":d.push({type:u,Provider:ft,props:o});break;case"modal":d.push({type:u,Provider:gt,props:a})}}),Pt({providersAndProps:d,configProviderProps:t})}const{message:Ot}=jt(["message"],{configProviderProps:{themeOverrides:ot},messageProviderProps:{placement:"top"}}),J=new Map;function T(e,t){const n=t.trim();if(!n)return;const i=`${e}:${n}`,r=Date.now();r-(J.get(i)??0)<800||(J.set(i,r),Ot[e](n,{closable:!0,duration:e==="error"?5e3:3800,keepAliveOnHover:!0}))}const $t={error:e=>T("error",e),info:e=>T("info",e),success:e=>T("success",e),warning:e=>T("warning",e)};export{$t as f,rt as u};
