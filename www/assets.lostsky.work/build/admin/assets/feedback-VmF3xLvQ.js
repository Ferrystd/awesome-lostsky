var se=t=>{throw TypeError(t)};var ne=(t,e,n)=>e.has(t)||se("Cannot "+n);var m=(t,e,n)=>(ne(t,e,"read from private field"),n?n.call(t):e.get(t)),H=(t,e,n)=>e.has(t)?se("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,n),T=(t,e,n,o)=>(ne(t,e,"write to private field"),o?o.call(t,n):e.set(t,n),n),F=(t,e,n)=>(ne(t,e,"access private method"),n);import{a0 as He,a2 as Te,am as le,an as Fe,a1 as Ke,ao as De,ap as ie,aq as We,p as ce,a5 as qe,a6 as Ue,h as D,ar as Ve,a7 as Xe,a8 as Qe,as as Ge,at as J,ak as I,au as Je,aa as Y,A as he,D as v,av as Ye,ac as b,d as j,v as f,aw as ve,ax as Ze,ay as et,G as Z,H as ee,ai as pe,l as R,R as N,az as me,F as re,aA as tt,ab as _,aB as nt,q as ot,aC as it,aD as ge,aE as rt,aF as at,aG as st,aj as be,aH as lt,aI as ct,x as dt,aJ as ut,aK as ft,W as ht,aL as K,P as vt,aM as pt,M as mt,al as gt,aN as bt,aO as yt,aP as xt,aQ as wt,aR as Ct,aS as St,aT as Rt,aU as kt,C as w,ad as M,aV as zt,u as de,aW as At,aX as Ot,aY as Pt,aZ as Lt,a_ as jt,a$ as Et,b0 as Mt}from"./index-zQZQ3wrk.js";import{u as $t}from"./RetryState.vue_vue_type_script_setup_true_lang-BEeS3nYw.js";var O,$,S,P,L,G,oe,fe,It=(fe=class extends He{constructor(e,n){super();H(this,L);H(this,O);H(this,$);H(this,S);H(this,P);T(this,O,e),this.setOptions(n),this.bindMethods(),F(this,L,G).call(this)}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){var o;const n=this.options;this.options=m(this,O).defaultMutationOptions(e),Te(this.options,n)||m(this,O).getMutationCache().notify({type:"observerOptionsUpdated",mutation:m(this,S),observer:this}),n!=null&&n.mutationKey&&this.options.mutationKey&&le(n.mutationKey)!==le(this.options.mutationKey)?this.reset():((o=m(this,S))==null?void 0:o.state.status)==="pending"&&m(this,S).setOptions(this.options)}onUnsubscribe(){var e;this.hasListeners()||(e=m(this,S))==null||e.removeObserver(this)}onMutationUpdate(e){F(this,L,G).call(this),F(this,L,oe).call(this,e)}getCurrentResult(){return m(this,$)}reset(){var e;(e=m(this,S))==null||e.removeObserver(this),T(this,S,void 0),F(this,L,G).call(this),F(this,L,oe).call(this)}mutate(e,n){var o;return T(this,P,n),(o=m(this,S))==null||o.removeObserver(this),T(this,S,m(this,O).getMutationCache().build(m(this,O),this.options)),m(this,S).addObserver(this),m(this,S).execute(e)}},O=new WeakMap,$=new WeakMap,S=new WeakMap,P=new WeakMap,L=new WeakSet,G=function(){var n;const e=((n=m(this,S))==null?void 0:n.state)??Fe();T(this,$,{...e,isPending:e.status==="pending",isSuccess:e.status==="success",isError:e.status==="error",isIdle:e.status==="idle",mutate:this.mutate,reset:this.reset})},oe=function(e){Ke.batch(()=>{var n,o,r,i,a,d,c,u;if(m(this,P)&&this.hasListeners()){const s=m(this,$).variables,h=m(this,$).context,y={client:m(this,O),meta:this.options.meta,mutationKey:this.options.mutationKey};if((e==null?void 0:e.type)==="success"){try{(o=(n=m(this,P)).onSuccess)==null||o.call(n,e.data,s,h,y)}catch(p){Promise.reject(p)}try{(i=(r=m(this,P)).onSettled)==null||i.call(r,e.data,null,s,h,y)}catch(p){Promise.reject(p)}}else if((e==null?void 0:e.type)==="error"){try{(d=(a=m(this,P)).onError)==null||d.call(a,e.error,s,h,y)}catch(p){Promise.reject(p)}try{(u=(c=m(this,P)).onSettled)==null||u.call(c,void 0,e.error,s,h,y)}catch(p){Promise.reject(p)}}}this.listeners.forEach(s=>{s(m(this,$))})})},fe);function mn(t,e){const n=$t(),o=D(()=>{const s=typeof t=="function"?t():t;return n.defaultMutationOptions(Xe(s))}),r=new It(n,o.value),i=o.value.shallow?De(r.getCurrentResult()):ie(r.getCurrentResult()),a=r.subscribe(s=>{We(i,s)}),d=(s,h)=>{r.mutate(s,h).catch(()=>{})};ce(o,()=>{r.setOptions(o.value)}),Qe(()=>{a()});const c=o.value.shallow?qe(i):Ue(i),u=Ve(c);return ce(()=>i.error,s=>{if(s&&Ge(o.value.throwOnError,[s]))throw s}),{...u,mutate:d,mutateAsync:i.mutate,reset:i.reset}}function Bt(){const t=I(Je,null);return t===null&&J("use-dialog","No outer <n-dialog-provider /> founded."),t}const ye=Y("n-loading-bar"),xe=Y("n-loading-bar-api");function Nt(t){const{primaryColor:e,errorColor:n}=t;return{colorError:n,colorLoading:e,height:"2px"}}const _t={common:he,self:Nt},Ht=v("loading-bar-container",`
 z-index: 5999;
 position: fixed;
 top: 0;
 left: 0;
 right: 0;
 height: 2px;
`,[Ye({enterDuration:"0.3s",leaveDuration:"0.8s"}),v("loading-bar",`
 width: 100%;
 transition:
 max-width 4s linear,
 background .2s linear;
 height: var(--n-height);
 `,[b("starting",`
 background: var(--n-color-loading);
 `),b("finishing",`
 background: var(--n-color-loading);
 transition:
 max-width .2s linear,
 background .2s linear;
 `),b("error",`
 background: var(--n-color-error);
 transition:
 max-width .2s linear,
 background .2s linear;
 `)])]);var U=function(t,e,n,o){function r(i){return i instanceof n?i:new n(function(a){a(i)})}return new(n||(n=Promise))(function(i,a){function d(s){try{u(o.next(s))}catch(h){a(h)}}function c(s){try{u(o.throw(s))}catch(h){a(h)}}function u(s){s.done?i(s.value):r(s.value).then(d,c)}u((o=o.apply(t,e||[])).next())})};function V(t,e){return`${e}-loading-bar ${e}-loading-bar--${t}`}const Tt=j({name:"LoadingBar",props:{containerClass:String,containerStyle:[String,Object]},setup(){const{inlineThemeDisabled:t}=Z(),{props:e,mergedClsPrefixRef:n}=I(ye),o=R(null),r=R(!1),i=R(!1),a=R(!1),d=R(!1);let c=!1;const u=R(!1),s=D(()=>{const{loadingBarStyle:g}=e;return g?g[u.value?"error":"loading"]:""});function h(){return U(this,void 0,void 0,function*(){r.value=!1,a.value=!1,c=!1,u.value=!1,d.value=!0,yield N(),d.value=!1})}function y(){return U(this,arguments,void 0,function*(g=0,W=80,q="starting"){if(i.value=!0,yield h(),c)return;a.value=!0,yield N();const A=o.value;A&&(A.style.maxWidth=`${g}%`,A.style.transition="none",A.offsetWidth,A.className=V(q,n.value),A.style.transition="",A.style.maxWidth=`${W}%`)})}function p(){return U(this,void 0,void 0,function*(){if(c||u.value)return;i.value&&(yield N()),c=!0;const g=o.value;g&&(g.className=V("finishing",n.value),g.style.maxWidth="100%",g.offsetWidth,a.value=!1)})}function l(){if(!(c||u.value))if(!a.value)y(100,100,"error").then(()=>{u.value=!0;const g=o.value;g&&(g.className=V("error",n.value),g.offsetWidth,a.value=!1)});else{u.value=!0;const g=o.value;if(!g)return;g.className=V("error",n.value),g.style.maxWidth="100%",g.offsetWidth,a.value=!1}}function x(){r.value=!0}function C(){r.value=!1}function z(){return U(this,void 0,void 0,function*(){yield h()})}const E=ee("LoadingBar","-loading-bar",Ht,_t,e,n),B=D(()=>{const{self:{height:g,colorError:W,colorLoading:q}}=E.value;return{"--n-height":g,"--n-color-loading":q,"--n-color-error":W}}),k=t?pe("loading-bar",void 0,B,e):void 0;return{mergedClsPrefix:n,loadingBarRef:o,started:i,loading:a,entering:r,transitionDisabled:d,start:y,error:l,finish:p,handleEnter:x,handleAfterEnter:C,handleAfterLeave:z,mergedLoadingBarStyle:s,cssVars:t?void 0:B,themeClass:k==null?void 0:k.themeClass,onRender:k==null?void 0:k.onRender}},render(){if(!this.started)return null;const{mergedClsPrefix:t}=this;return f(ve,{name:"fade-in-transition",appear:!0,onEnter:this.handleEnter,onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave,css:!this.transitionDisabled},{default:()=>{var e;return(e=this.onRender)===null||e===void 0||e.call(this),Ze(f("div",{class:[`${t}-loading-bar-container`,this.themeClass,this.containerClass],style:this.containerStyle},f("div",{ref:"loadingBarRef",class:[`${t}-loading-bar`],style:[this.cssVars,this.mergedLoadingBarStyle]})),[[et,this.loading||!this.loading&&this.entering]])}})}}),Ft=Object.assign(Object.assign({},ee.props),{to:{type:[String,Object,Boolean],default:void 0},containerClass:String,containerStyle:[String,Object],loadingBarStyle:{type:Object}}),Kt=j({name:"LoadingBarProvider",props:Ft,setup(t){const e=tt(),n=R(null),o={start(){var i;e.value?(i=n.value)===null||i===void 0||i.start():N(()=>{var a;(a=n.value)===null||a===void 0||a.start()})},error(){var i;e.value?(i=n.value)===null||i===void 0||i.error():N(()=>{var a;(a=n.value)===null||a===void 0||a.error()})},finish(){var i;e.value?(i=n.value)===null||i===void 0||i.finish():N(()=>{var a;(a=n.value)===null||a===void 0||a.finish()})}},{mergedClsPrefixRef:r}=Z(t);return _(xe,o),_(ye,{props:t,mergedClsPrefixRef:r}),Object.assign(o,{loadingBarRef:n})},render(){var t,e;return f(re,null,f(me,{disabled:this.to===!1,to:this.to||"body"},f(Tt,{ref:"loadingBarRef",containerStyle:this.containerStyle,containerClass:this.containerClass})),(e=(t=this.$slots).default)===null||e===void 0?void 0:e.call(t))}});function Dt(){const t=I(xe,null);return t===null&&J("use-loading-bar","No outer <n-loading-bar-provider /> founded."),t}function Wt(){const t=I(nt,null);return t===null&&J("use-message","No outer <n-message-provider /> founded. See prerequisite in https://www.naiveui.com/en-US/os-theme/components/message for more details. If you want to use `useMessage` outside setup, please check https://www.naiveui.com/zh-CN/os-theme/components/message#Q-&-A."),t}const qt=j({name:"ModalEnvironment",props:Object.assign(Object.assign({},it),{internalKey:{type:String,required:!0},onInternalAfterLeave:{type:Function,required:!0}}),setup(t){const e=R(!0);function n(){const{onInternalAfterLeave:s,internalKey:h,onAfterLeave:y}=t;s&&s(h),y&&y()}function o(){const{onPositiveClick:s}=t;s?Promise.resolve(s()).then(h=>{h!==!1&&c()}):c()}function r(){const{onNegativeClick:s}=t;s?Promise.resolve(s()).then(h=>{h!==!1&&c()}):c()}function i(){const{onClose:s}=t;s?Promise.resolve(s()).then(h=>{h!==!1&&c()}):c()}function a(s){const{onMaskClick:h,maskClosable:y}=t;h&&(h(s),y&&c())}function d(){const{onEsc:s}=t;s&&s()}function c(){e.value=!1}function u(s){e.value=s}return{show:e,hide:c,handleUpdateShow:u,handleAfterLeave:n,handleCloseClick:i,handleNegativeClick:r,handlePositiveClick:o,handleMaskClick:a,handleEsc:d}},render(){const{handleUpdateShow:t,handleAfterLeave:e,handleMaskClick:n,handleEsc:o,show:r}=this;return f(ot,Object.assign({},this.$props,{show:r,onUpdateShow:t,onMaskClick:n,onEsc:o,onAfterLeave:e,internalAppear:!0,internalModal:!0}),this.$slots)}}),Ut={to:[String,Object]},Vt=j({name:"ModalProvider",props:Ut,setup(){const t=R([]),e={};function n(a={}){const d=be(),c=ie(Object.assign(Object.assign({},a),{key:d,destroy:()=>{var u;(u=e[`n-modal-${d}`])===null||u===void 0||u.hide()}}));return t.value.push(c),c}function o(a){const{value:d}=t;d.splice(d.findIndex(c=>c.key===a),1)}function r(){Object.values(e).forEach(a=>{a==null||a.hide()})}const i={create:n,destroyAll:r};return _(lt,i),_(st,{clickedRef:at(64),clickedPositionRef:rt()}),_(ct,t),Object.assign(Object.assign({},i),{modalList:t,modalInstRefs:e,handleAfterLeave:o})},render(){var t,e;return f(re,null,[this.modalList.map(n=>{var o;return f(qt,ge(n,["destroy","render"],{to:(o=n.to)!==null&&o!==void 0?o:this.to,ref:r=>{r===null?delete this.modalInstRefs[`n-modal-${n.key}`]:this.modalInstRefs[`n-modal-${n.key}`]=r},internalKey:n.key,onInternalAfterLeave:this.handleAfterLeave}),{default:n.render})}),(e=(t=this.$slots).default)===null||e===void 0?void 0:e.call(t)])}}),Xt={closeMargin:"16px 12px",closeSize:"20px",closeIconSize:"16px",width:"365px",padding:"16px",titleFontSize:"16px",metaFontSize:"12px",descriptionFontSize:"12px"};function Qt(t){const{textColor2:e,successColor:n,infoColor:o,warningColor:r,errorColor:i,popoverColor:a,closeIconColor:d,closeIconColorHover:c,closeIconColorPressed:u,closeColorHover:s,closeColorPressed:h,textColor1:y,textColor3:p,borderRadius:l,fontWeightStrong:x,boxShadow2:C,lineHeight:z,fontSize:E}=t;return Object.assign(Object.assign({},Xt),{borderRadius:l,lineHeight:z,fontSize:E,headerFontWeight:x,iconColor:e,iconColorSuccess:n,iconColorInfo:o,iconColorWarning:r,iconColorError:i,color:a,textColor:e,closeIconColor:d,closeIconColorHover:c,closeIconColorPressed:u,closeBorderRadius:l,closeColorHover:s,closeColorPressed:h,headerTextColor:y,descriptionTextColor:p,actionTextColor:e,boxShadow:C})}const Gt=dt({name:"Notification",common:he,peers:{Scrollbar:ut},self:Qt}),te=Y("n-notification-provider"),Jt=j({name:"NotificationContainer",props:{scrollable:{type:Boolean,required:!0},placement:{type:String,required:!0}},setup(){const{mergedThemeRef:t,mergedClsPrefixRef:e,wipTransitionCountRef:n}=I(te),o=R(null);return ht(()=>{var r,i;n.value>0?(r=o==null?void 0:o.value)===null||r===void 0||r.classList.add("transitioning"):(i=o==null?void 0:o.value)===null||i===void 0||i.classList.remove("transitioning")}),{selfRef:o,mergedTheme:t,mergedClsPrefix:e,transitioning:n}},render(){const{$slots:t,scrollable:e,mergedClsPrefix:n,mergedTheme:o,placement:r}=this;return f("div",{ref:"selfRef",class:[`${n}-notification-container`,e&&`${n}-notification-container--scrollable`,`${n}-notification-container--${r}`]},e?f(ft,{theme:o.peers.Scrollbar,themeOverrides:o.peerOverrides.Scrollbar,contentStyle:{overflow:"hidden"}},t):t)}}),Yt={info:()=>f(St,null),success:()=>f(Ct,null),warning:()=>f(wt,null),error:()=>f(xt,null),default:()=>null},ae={closable:{type:Boolean,default:!0},type:{type:String,default:"default"},avatar:Function,title:[String,Function],description:[String,Function],content:[String,Function],meta:[String,Function],action:[String,Function],onClose:{type:Function,required:!0},keepAliveOnHover:Boolean,onMouseenter:Function,onMouseleave:Function},Zt=yt(ae),en=j({name:"Notification",props:ae,setup(t){const{mergedClsPrefixRef:e,mergedThemeRef:n,props:o}=I(te),{inlineThemeDisabled:r,mergedRtlRef:i}=Z(),a=mt("Notification",i,e),d=D(()=>{const{type:u}=t,{self:{color:s,textColor:h,closeIconColor:y,closeIconColorHover:p,closeIconColorPressed:l,headerTextColor:x,descriptionTextColor:C,actionTextColor:z,borderRadius:E,headerFontWeight:B,boxShadow:k,lineHeight:g,fontSize:W,closeMargin:q,closeSize:A,width:Ce,padding:Se,closeIconSize:Re,closeBorderRadius:ke,closeColorHover:ze,closeColorPressed:Ae,titleFontSize:Oe,metaFontSize:Pe,descriptionFontSize:Le,[gt("iconColor",u)]:je},common:{cubicBezierEaseOut:Ee,cubicBezierEaseIn:Me,cubicBezierEaseInOut:$e}}=n.value,{left:Ie,right:Be,top:Ne,bottom:_e}=bt(Se);return{"--n-color":s,"--n-font-size":W,"--n-text-color":h,"--n-description-text-color":C,"--n-action-text-color":z,"--n-title-text-color":x,"--n-title-font-weight":B,"--n-bezier":$e,"--n-bezier-ease-out":Ee,"--n-bezier-ease-in":Me,"--n-border-radius":E,"--n-box-shadow":k,"--n-close-border-radius":ke,"--n-close-color-hover":ze,"--n-close-color-pressed":Ae,"--n-close-icon-color":y,"--n-close-icon-color-hover":p,"--n-close-icon-color-pressed":l,"--n-line-height":g,"--n-icon-color":je,"--n-close-margin":q,"--n-close-size":A,"--n-close-icon-size":Re,"--n-width":Ce,"--n-padding-left":Ie,"--n-padding-right":Be,"--n-padding-top":Ne,"--n-padding-bottom":_e,"--n-title-font-size":Oe,"--n-meta-font-size":Pe,"--n-description-font-size":Le}}),c=r?pe("notification",D(()=>t.type[0]),d,o):void 0;return{mergedClsPrefix:e,showAvatar:D(()=>t.avatar||t.type!=="default"),handleCloseClick(){t.onClose()},rtlEnabled:a,cssVars:r?void 0:d,themeClass:c==null?void 0:c.themeClass,onRender:c==null?void 0:c.onRender}},render(){var t;const{mergedClsPrefix:e}=this;return(t=this.onRender)===null||t===void 0||t.call(this),f("div",{class:[`${e}-notification-wrapper`,this.themeClass],onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave,style:this.cssVars},f("div",{class:[`${e}-notification`,this.rtlEnabled&&`${e}-notification--rtl`,this.themeClass,{[`${e}-notification--closable`]:this.closable,[`${e}-notification--show-avatar`]:this.showAvatar}],style:this.cssVars},this.showAvatar?f("div",{class:`${e}-notification__avatar`},this.avatar?K(this.avatar):this.type!=="default"?f(vt,{clsPrefix:e},{default:()=>Yt[this.type]()}):null):null,this.closable?f(pt,{clsPrefix:e,class:`${e}-notification__close`,onClick:this.handleCloseClick}):null,f("div",{ref:"bodyRef",class:`${e}-notification-main`},this.title?f("div",{class:`${e}-notification-main__header`},K(this.title)):null,this.description?f("div",{class:`${e}-notification-main__description`},K(this.description)):null,this.content?f("pre",{class:`${e}-notification-main__content`},K(this.content)):null,this.meta||this.action?f("div",{class:`${e}-notification-main-footer`},this.meta?f("div",{class:`${e}-notification-main-footer__meta`},K(this.meta)):null,this.action?f("div",{class:`${e}-notification-main-footer__action`},K(this.action)):null):null)))}}),tn=Object.assign(Object.assign({},ae),{duration:Number,onClose:Function,onLeave:Function,onAfterEnter:Function,onAfterLeave:Function,onHide:Function,onAfterShow:Function,onAfterHide:Function}),nn=j({name:"NotificationEnvironment",props:Object.assign(Object.assign({},tn),{internalKey:{type:String,required:!0},onInternalAfterLeave:{type:Function,required:!0}}),setup(t){const{wipTransitionCountRef:e}=I(te),n=R(!0);let o=null;function r(){n.value=!1,o&&window.clearTimeout(o)}function i(l){e.value++,N(()=>{l.style.height=`${l.offsetHeight}px`,l.style.maxHeight="0",l.style.transition="none",l.offsetHeight,l.style.transition="",l.style.maxHeight=l.style.height})}function a(l){e.value--,l.style.height="",l.style.maxHeight="";const{onAfterEnter:x,onAfterShow:C}=t;x&&x(),C&&C()}function d(l){e.value++,l.style.maxHeight=`${l.offsetHeight}px`,l.style.height=`${l.offsetHeight}px`,l.offsetHeight}function c(l){const{onHide:x}=t;x&&x(),l.style.maxHeight="0",l.offsetHeight}function u(){e.value--;const{onAfterLeave:l,onInternalAfterLeave:x,onAfterHide:C,internalKey:z}=t;l&&l(),x(z),C&&C()}function s(){const{duration:l}=t;l&&(o=window.setTimeout(r,l))}function h(l){l.currentTarget===l.target&&o!==null&&(window.clearTimeout(o),o=null)}function y(l){l.currentTarget===l.target&&s()}function p(){const{onClose:l}=t;l?Promise.resolve(l()).then(x=>{x!==!1&&r()}):r()}return kt(()=>{t.duration&&(o=window.setTimeout(r,t.duration))}),{show:n,hide:r,handleClose:p,handleAfterLeave:u,handleLeave:c,handleBeforeLeave:d,handleAfterEnter:a,handleBeforeEnter:i,handleMouseenter:h,handleMouseleave:y}},render(){return f(ve,{name:"notification-transition",appear:!0,onBeforeEnter:this.handleBeforeEnter,onAfterEnter:this.handleAfterEnter,onBeforeLeave:this.handleBeforeLeave,onLeave:this.handleLeave,onAfterLeave:this.handleAfterLeave},{default:()=>this.show?f(en,Object.assign({},Rt(this.$props,Zt),{onClose:this.handleClose,onMouseenter:this.duration&&this.keepAliveOnHover?this.handleMouseenter:void 0,onMouseleave:this.duration&&this.keepAliveOnHover?this.handleMouseleave:void 0})):null})}}),on=w([v("notification-container",`
 z-index: 4000;
 position: fixed;
 overflow: visible;
 display: flex;
 flex-direction: column;
 align-items: flex-end;
 `,[w(">",[v("scrollbar",`
 width: initial;
 overflow: visible;
 height: -moz-fit-content !important;
 height: fit-content !important;
 max-height: 100vh !important;
 `,[w(">",[v("scrollbar-container",`
 height: -moz-fit-content !important;
 height: fit-content !important;
 max-height: 100vh !important;
 `,[v("scrollbar-content",`
 padding-top: 12px;
 padding-bottom: 33px;
 `)])])])]),b("top, top-right, top-left",`
 top: 12px;
 `,[w("&.transitioning >",[v("scrollbar",[w(">",[v("scrollbar-container",`
 min-height: 100vh !important;
 `)])])])]),b("bottom, bottom-right, bottom-left",`
 bottom: 12px;
 `,[w(">",[v("scrollbar",[w(">",[v("scrollbar-container",[v("scrollbar-content",`
 padding-bottom: 12px;
 `)])])])]),v("notification-wrapper",`
 display: flex;
 align-items: flex-end;
 margin-bottom: 0;
 margin-top: 12px;
 `)]),b("top, bottom",`
 left: 50%;
 transform: translateX(-50%);
 `,[v("notification-wrapper",[w("&.notification-transition-enter-from, &.notification-transition-leave-to",`
 transform: scale(0.85);
 `),w("&.notification-transition-leave-from, &.notification-transition-enter-to",`
 transform: scale(1);
 `)])]),b("top",[v("notification-wrapper",`
 transform-origin: top center;
 `)]),b("bottom",[v("notification-wrapper",`
 transform-origin: bottom center;
 `)]),b("top-right, bottom-right",[v("notification",`
 margin-left: 28px;
 margin-right: 16px;
 `)]),b("top-left, bottom-left",[v("notification",`
 margin-left: 16px;
 margin-right: 28px;
 `)]),b("top-right",`
 right: 0;
 `,[X("top-right")]),b("top-left",`
 left: 0;
 `,[X("top-left")]),b("bottom-right",`
 right: 0;
 `,[X("bottom-right")]),b("bottom-left",`
 left: 0;
 `,[X("bottom-left")]),b("scrollable",[b("top-right",`
 top: 0;
 `),b("top-left",`
 top: 0;
 `),b("bottom-right",`
 bottom: 0;
 `),b("bottom-left",`
 bottom: 0;
 `)]),v("notification-wrapper",`
 margin-bottom: 12px;
 `,[w("&.notification-transition-enter-from, &.notification-transition-leave-to",`
 opacity: 0;
 margin-top: 0 !important;
 margin-bottom: 0 !important;
 `),w("&.notification-transition-leave-from, &.notification-transition-enter-to",`
 opacity: 1;
 `),w("&.notification-transition-leave-active",`
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 transform .3s var(--n-bezier-ease-in),
 max-height .3s var(--n-bezier),
 margin-top .3s linear,
 margin-bottom .3s linear,
 box-shadow .3s var(--n-bezier);
 `),w("&.notification-transition-enter-active",`
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
 `,[M("avatar",[v("icon",`
 color: var(--n-icon-color);
 `),v("base-icon",`
 color: var(--n-icon-color);
 `)]),b("show-avatar",[v("notification-main",`
 margin-left: 40px;
 width: calc(100% - 40px); 
 `)]),b("closable",[v("notification-main",[w("> *:first-child",`
 padding-right: 20px;
 `)]),M("close",`
 position: absolute;
 top: 0;
 right: 0;
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `)]),M("avatar",`
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
 `,[M("meta",`
 font-size: var(--n-meta-font-size);
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-description-text-color);
 `),M("action",`
 cursor: pointer;
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-action-text-color);
 `)]),M("header",`
 font-weight: var(--n-title-font-weight);
 font-size: var(--n-title-font-size);
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-title-text-color);
 `),M("description",`
 margin-top: 8px;
 font-size: var(--n-description-font-size);
 white-space: pre-wrap;
 word-wrap: break-word;
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-description-text-color);
 `),M("content",`
 line-height: var(--n-line-height);
 margin: 12px 0 0 0;
 font-family: inherit;
 white-space: pre-wrap;
 word-wrap: break-word;
 transition: color .3s var(--n-bezier-ease-out);
 color: var(--n-text-color);
 `,[w("&:first-child","margin: 0;")])])])])]);function X(t){const n=t.split("-")[1]==="left"?"calc(-100%)":"calc(100%)";return v("notification-wrapper",[w("&.notification-transition-enter-from, &.notification-transition-leave-to",`
 transform: translate(${n}, 0);
 `),w("&.notification-transition-leave-from, &.notification-transition-enter-to",`
 transform: translate(0, 0);
 `)])}const we=Y("n-notification-api"),rn=Object.assign(Object.assign({},ee.props),{containerClass:String,containerStyle:[String,Object],to:[String,Object],scrollable:{type:Boolean,default:!0},max:Number,placement:{type:String,default:"top-right"},keepAliveOnHover:Boolean}),an=j({name:"NotificationProvider",props:rn,setup(t){const{mergedClsPrefixRef:e}=Z(t),n=R([]),o={},r=new Set;function i(p){const l=be(),x=()=>{r.add(l),o[l]&&o[l].hide()},C=ie(Object.assign(Object.assign({},p),{key:l,destroy:x,hide:x,deactivate:x})),{max:z}=t;if(z&&n.value.length-r.size>=z){let E=!1,B=0;for(const k of n.value){if(!r.has(k.key)){o[k.key]&&(k.destroy(),E=!0);break}B++}E||n.value.splice(B,1)}return n.value.push(C),C}const a=["info","success","warning","error"].map(p=>l=>i(Object.assign(Object.assign({},l),{type:p})));function d(p){r.delete(p),n.value.splice(n.value.findIndex(l=>l.key===p),1)}const c=ee("Notification","-notification",on,Gt,t,e),u={create:i,info:a[0],success:a[1],warning:a[2],error:a[3],open:h,destroyAll:y},s=R(0);_(we,u),_(te,{props:t,mergedClsPrefixRef:e,mergedThemeRef:c,wipTransitionCountRef:s});function h(p){return i(p)}function y(){Object.values(n.value).forEach(p=>{p.hide()})}return Object.assign({mergedClsPrefix:e,notificationList:n,notificationRefs:o,handleAfterLeave:d},u)},render(){var t,e,n;const{placement:o}=this;return f(re,null,(e=(t=this.$slots).default)===null||e===void 0?void 0:e.call(t),this.notificationList.length?f(me,{to:(n=this.to)!==null&&n!==void 0?n:"body"},f(Jt,{class:this.containerClass,style:this.containerStyle,scrollable:this.scrollable&&o!=="top"&&o!=="bottom",placement:o},{default:()=>this.notificationList.map(r=>f(nn,Object.assign({ref:i=>{const a=r.key;i===null?delete this.notificationRefs[a]:this.notificationRefs[a]=i}},ge(r,["destroy","hide","deactivate"]),{internalKey:r.key,onInternalAfterLeave:this.handleAfterLeave,keepAliveOnHover:r.keepAliveOnHover===void 0?this.keepAliveOnHover:r.keepAliveOnHover})))})):null)}});function sn(){const t=I(we,null);return t===null&&J("use-notification","No outer `n-notification-provider` found."),t}const ln=j({name:"InjectionExtractor",props:{onSetup:Function},setup(t,{slots:e}){var n;return(n=t.onSetup)===null||n===void 0||n.call(t),()=>{var o;return(o=e.default)===null||o===void 0?void 0:o.call(e)}}}),cn={message:Wt,notification:sn,loadingBar:Dt,dialog:Bt,modal:At};function dn({providersAndProps:t,configProviderProps:e}){let n=zt(r);const o={app:n};function r(){return f(Ot,de(e),{default:()=>t.map(({type:d,Provider:c,props:u})=>f(c,de(u),{default:()=>f(ln,{onSetup:()=>o[d]=cn[d]()})}))})}let i;return Pt&&(i=document.createElement("div"),document.body.appendChild(i),n.mount(i)),Object.assign({unmount:()=>{var d;if(n===null||i===null){Lt("discrete","unmount call no need because discrete app has been unmounted");return}n.unmount(),(d=i.parentNode)===null||d===void 0||d.removeChild(i),i=null,n=null}},o)}function un(t,{configProviderProps:e,messageProviderProps:n,dialogProviderProps:o,notificationProviderProps:r,loadingBarProviderProps:i,modalProviderProps:a}={}){const d=[];return t.forEach(u=>{switch(u){case"message":d.push({type:u,Provider:Et,props:n});break;case"notification":d.push({type:u,Provider:an,props:r});break;case"dialog":d.push({type:u,Provider:jt,props:o});break;case"loadingBar":d.push({type:u,Provider:Kt,props:i});break;case"modal":d.push({type:u,Provider:Vt,props:a})}}),dn({providersAndProps:d,configProviderProps:e})}const{message:fn}=un(["message"],{configProviderProps:{themeOverrides:Mt},messageProviderProps:{placement:"top"}}),ue=new Map;function Q(t,e){const n=e.trim();if(!n)return;const o=`${t}:${n}`,r=Date.now();r-(ue.get(o)??0)<800||(ue.set(o,r),fn[t](n,{closable:!0,duration:t==="error"?5e3:3800,keepAliveOnHover:!0}))}const gn={error:t=>Q("error",t),info:t=>Q("info",t),success:t=>Q("success",t),warning:t=>Q("warning",t)};export{Bt as a,gn as f,mn as u};
