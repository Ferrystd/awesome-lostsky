var de=t=>{throw TypeError(t)};var ie=(t,e,n)=>e.has(t)||de("Cannot "+n);var m=(t,e,n)=>(ie(t,e,"read from private field"),n?n.call(t):e.get(t)),T=(t,e,n)=>e.has(t)?de("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(t):e.set(t,n),H=(t,e,n,o)=>(ie(t,e,"write to private field"),o?o.call(t,n):e.set(t,n),n),F=(t,e,n)=>(ie(t,e,"access private method"),n);import{H as De,J as qe,bp as ue,bq as We,I as Ve,br as Ue,b0 as se,bs as Xe,z as fe,M as Qe,O as Ge,i as D,b2 as Je,P as Ye,Q as Ze,bt as et,bj as Z,T as I,bu as tt,Y as ee,X as ge,a0 as v,bv as nt,a2 as b,d as A,k as f,a6 as be,bg as ot,bw as it,a3 as te,aa as ne,ac as ye,n as k,b1 as $,bx as xe,F as le,bl as rt,ad as N,by as at,A as st,bz as lt,bA as we,bB as ct,bC as dt,bD as ut,a8 as Ce,bE as ft,bF as ht,ah as vt,am as pt,aG as mt,D as gt,bG as K,aE as bt,bH as yt,au as xt,ag as wt,bI as Ct,bJ as St,bK as kt,bL as Rt,bM as zt,bN as At,bO as Ot,ab as Pt,Z as w,a1 as M,bP as Lt,u as he,bQ as jt,bR as Et,bS as Mt,af as Bt,bT as It,bU as _t,bV as $t,o as V,a as U,g as Nt,j as Tt,t as re,h as ve,x as Ht,m as Ft}from"./index-DxtIzeCm.js";import{u as Kt}from"./LsPageHeader-D-_ygmeP.js";var P,B,S,L,j,Y,ae,me,Dt=(me=class extends De{constructor(e,n){super();T(this,j);T(this,P);T(this,B);T(this,S);T(this,L);H(this,P,e),this.setOptions(n),this.bindMethods(),F(this,j,Y).call(this)}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){var o;const n=this.options;this.options=m(this,P).defaultMutationOptions(e),qe(this.options,n)||m(this,P).getMutationCache().notify({type:"observerOptionsUpdated",mutation:m(this,S),observer:this}),n!=null&&n.mutationKey&&this.options.mutationKey&&ue(n.mutationKey)!==ue(this.options.mutationKey)?this.reset():((o=m(this,S))==null?void 0:o.state.status)==="pending"&&m(this,S).setOptions(this.options)}onUnsubscribe(){var e;this.hasListeners()||(e=m(this,S))==null||e.removeObserver(this)}onMutationUpdate(e){F(this,j,Y).call(this),F(this,j,ae).call(this,e)}getCurrentResult(){return m(this,B)}reset(){var e;(e=m(this,S))==null||e.removeObserver(this),H(this,S,void 0),F(this,j,Y).call(this),F(this,j,ae).call(this)}mutate(e,n){var o;return H(this,L,n),(o=m(this,S))==null||o.removeObserver(this),H(this,S,m(this,P).getMutationCache().build(m(this,P),this.options)),m(this,S).addObserver(this),m(this,S).execute(e)}},P=new WeakMap,B=new WeakMap,S=new WeakMap,L=new WeakMap,j=new WeakSet,Y=function(){var n;const e=((n=m(this,S))==null?void 0:n.state)??We();H(this,B,{...e,isPending:e.status==="pending",isSuccess:e.status==="success",isError:e.status==="error",isIdle:e.status==="idle",mutate:this.mutate,reset:this.reset})},ae=function(e){Ve.batch(()=>{var n,o,r,i,a,d,c,u;if(m(this,L)&&this.hasListeners()){const s=m(this,B).variables,h=m(this,B).context,y={client:m(this,P),meta:this.options.meta,mutationKey:this.options.mutationKey};if((e==null?void 0:e.type)==="success"){try{(o=(n=m(this,L)).onSuccess)==null||o.call(n,e.data,s,h,y)}catch(p){Promise.reject(p)}try{(i=(r=m(this,L)).onSettled)==null||i.call(r,e.data,null,s,h,y)}catch(p){Promise.reject(p)}}else if((e==null?void 0:e.type)==="error"){try{(d=(a=m(this,L)).onError)==null||d.call(a,e.error,s,h,y)}catch(p){Promise.reject(p)}try{(u=(c=m(this,L)).onSettled)==null||u.call(c,void 0,e.error,s,h,y)}catch(p){Promise.reject(p)}}}this.listeners.forEach(s=>{s(m(this,B))})})},me);function Ln(t,e){const n=Kt(),o=D(()=>{const s=typeof t=="function"?t():t;return n.defaultMutationOptions(Ye(s))}),r=new Dt(n,o.value),i=o.value.shallow?Ue(r.getCurrentResult()):se(r.getCurrentResult()),a=r.subscribe(s=>{Xe(i,s)}),d=(s,h)=>{r.mutate(s,h).catch(()=>{})};fe(o,()=>{r.setOptions(o.value)}),Ze(()=>{a()});const c=o.value.shallow?Qe(i):Ge(i),u=Je(c);return fe(()=>i.error,s=>{if(s&&et(o.value.throwOnError,[s]))throw s}),{...u,mutate:d,mutateAsync:i.mutate,reset:i.reset}}function qt(){const t=I(tt,null);return t===null&&Z("use-dialog","No outer <n-dialog-provider /> founded."),t}const Se=ee("n-loading-bar"),ke=ee("n-loading-bar-api");function Wt(t){const{primaryColor:e,errorColor:n}=t;return{colorError:n,colorLoading:e,height:"2px"}}const Vt={common:ge,self:Wt},Ut=v("loading-bar-container",`
 z-index: 5999;
 position: fixed;
 top: 0;
 left: 0;
 right: 0;
 height: 2px;
`,[nt({enterDuration:"0.3s",leaveDuration:"0.8s"}),v("loading-bar",`
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
 `)])]);var X=function(t,e,n,o){function r(i){return i instanceof n?i:new n(function(a){a(i)})}return new(n||(n=Promise))(function(i,a){function d(s){try{u(o.next(s))}catch(h){a(h)}}function c(s){try{u(o.throw(s))}catch(h){a(h)}}function u(s){s.done?i(s.value):r(s.value).then(d,c)}u((o=o.apply(t,e||[])).next())})};function Q(t,e){return`${e}-loading-bar ${e}-loading-bar--${t}`}const Xt=A({name:"LoadingBar",props:{containerClass:String,containerStyle:[String,Object]},setup(){const{inlineThemeDisabled:t}=te(),{props:e,mergedClsPrefixRef:n}=I(Se),o=k(null),r=k(!1),i=k(!1),a=k(!1),d=k(!1);let c=!1;const u=k(!1),s=D(()=>{const{loadingBarStyle:g}=e;return g?g[u.value?"error":"loading"]:""});function h(){return X(this,void 0,void 0,function*(){r.value=!1,a.value=!1,c=!1,u.value=!1,d.value=!0,yield $(),d.value=!1})}function y(){return X(this,arguments,void 0,function*(g=0,q=80,W="starting"){if(i.value=!0,yield h(),c)return;a.value=!0,yield $();const O=o.value;O&&(O.style.maxWidth=`${g}%`,O.style.transition="none",O.offsetWidth,O.className=Q(W,n.value),O.style.transition="",O.style.maxWidth=`${q}%`)})}function p(){return X(this,void 0,void 0,function*(){if(c||u.value)return;i.value&&(yield $()),c=!0;const g=o.value;g&&(g.className=Q("finishing",n.value),g.style.maxWidth="100%",g.offsetWidth,a.value=!1)})}function l(){if(!(c||u.value))if(!a.value)y(100,100,"error").then(()=>{u.value=!0;const g=o.value;g&&(g.className=Q("error",n.value),g.offsetWidth,a.value=!1)});else{u.value=!0;const g=o.value;if(!g)return;g.className=Q("error",n.value),g.style.maxWidth="100%",g.offsetWidth,a.value=!1}}function x(){r.value=!0}function C(){r.value=!1}function z(){return X(this,void 0,void 0,function*(){yield h()})}const E=ne("LoadingBar","-loading-bar",Ut,Vt,e,n),_=D(()=>{const{self:{height:g,colorError:q,colorLoading:W}}=E.value;return{"--n-height":g,"--n-color-loading":W,"--n-color-error":q}}),R=t?ye("loading-bar",void 0,_,e):void 0;return{mergedClsPrefix:n,loadingBarRef:o,started:i,loading:a,entering:r,transitionDisabled:d,start:y,error:l,finish:p,handleEnter:x,handleAfterEnter:C,handleAfterLeave:z,mergedLoadingBarStyle:s,cssVars:t?void 0:_,themeClass:R==null?void 0:R.themeClass,onRender:R==null?void 0:R.onRender}},render(){if(!this.started)return null;const{mergedClsPrefix:t}=this;return f(be,{name:"fade-in-transition",appear:!0,onEnter:this.handleEnter,onAfterEnter:this.handleAfterEnter,onAfterLeave:this.handleAfterLeave,css:!this.transitionDisabled},{default:()=>{var e;return(e=this.onRender)===null||e===void 0||e.call(this),ot(f("div",{class:[`${t}-loading-bar-container`,this.themeClass,this.containerClass],style:this.containerStyle},f("div",{ref:"loadingBarRef",class:[`${t}-loading-bar`],style:[this.cssVars,this.mergedLoadingBarStyle]})),[[it,this.loading||!this.loading&&this.entering]])}})}}),Qt=Object.assign(Object.assign({},ne.props),{to:{type:[String,Object,Boolean],default:void 0},containerClass:String,containerStyle:[String,Object],loadingBarStyle:{type:Object}}),Gt=A({name:"LoadingBarProvider",props:Qt,setup(t){const e=rt(),n=k(null),o={start(){var i;e.value?(i=n.value)===null||i===void 0||i.start():$(()=>{var a;(a=n.value)===null||a===void 0||a.start()})},error(){var i;e.value?(i=n.value)===null||i===void 0||i.error():$(()=>{var a;(a=n.value)===null||a===void 0||a.error()})},finish(){var i;e.value?(i=n.value)===null||i===void 0||i.finish():$(()=>{var a;(a=n.value)===null||a===void 0||a.finish()})}},{mergedClsPrefixRef:r}=te(t);return N(ke,o),N(Se,{props:t,mergedClsPrefixRef:r}),Object.assign(o,{loadingBarRef:n})},render(){var t,e;return f(le,null,f(xe,{disabled:this.to===!1,to:this.to||"body"},f(Xt,{ref:"loadingBarRef",containerStyle:this.containerStyle,containerClass:this.containerClass})),(e=(t=this.$slots).default)===null||e===void 0?void 0:e.call(t))}});function Jt(){const t=I(ke,null);return t===null&&Z("use-loading-bar","No outer <n-loading-bar-provider /> founded."),t}function Yt(){const t=I(at,null);return t===null&&Z("use-message","No outer <n-message-provider /> founded. See prerequisite in https://www.naiveui.com/en-US/os-theme/components/message for more details. If you want to use `useMessage` outside setup, please check https://www.naiveui.com/zh-CN/os-theme/components/message#Q-&-A."),t}const Zt=A({name:"ModalEnvironment",props:Object.assign(Object.assign({},lt),{internalKey:{type:String,required:!0},onInternalAfterLeave:{type:Function,required:!0}}),setup(t){const e=k(!0);function n(){const{onInternalAfterLeave:s,internalKey:h,onAfterLeave:y}=t;s&&s(h),y&&y()}function o(){const{onPositiveClick:s}=t;s?Promise.resolve(s()).then(h=>{h!==!1&&c()}):c()}function r(){const{onNegativeClick:s}=t;s?Promise.resolve(s()).then(h=>{h!==!1&&c()}):c()}function i(){const{onClose:s}=t;s?Promise.resolve(s()).then(h=>{h!==!1&&c()}):c()}function a(s){const{onMaskClick:h,maskClosable:y}=t;h&&(h(s),y&&c())}function d(){const{onEsc:s}=t;s&&s()}function c(){e.value=!1}function u(s){e.value=s}return{show:e,hide:c,handleUpdateShow:u,handleAfterLeave:n,handleCloseClick:i,handleNegativeClick:r,handlePositiveClick:o,handleMaskClick:a,handleEsc:d}},render(){const{handleUpdateShow:t,handleAfterLeave:e,handleMaskClick:n,handleEsc:o,show:r}=this;return f(st,Object.assign({},this.$props,{show:r,onUpdateShow:t,onMaskClick:n,onEsc:o,onAfterLeave:e,internalAppear:!0,internalModal:!0}),this.$slots)}}),en={to:[String,Object]},tn=A({name:"ModalProvider",props:en,setup(){const t=k([]),e={};function n(a={}){const d=Ce(),c=se(Object.assign(Object.assign({},a),{key:d,destroy:()=>{var u;(u=e[`n-modal-${d}`])===null||u===void 0||u.hide()}}));return t.value.push(c),c}function o(a){const{value:d}=t;d.splice(d.findIndex(c=>c.key===a),1)}function r(){Object.values(e).forEach(a=>{a==null||a.hide()})}const i={create:n,destroyAll:r};return N(ft,i),N(ut,{clickedRef:dt(64),clickedPositionRef:ct()}),N(ht,t),Object.assign(Object.assign({},i),{modalList:t,modalInstRefs:e,handleAfterLeave:o})},render(){var t,e;return f(le,null,[this.modalList.map(n=>{var o;return f(Zt,we(n,["destroy","render"],{to:(o=n.to)!==null&&o!==void 0?o:this.to,ref:r=>{r===null?delete this.modalInstRefs[`n-modal-${n.key}`]:this.modalInstRefs[`n-modal-${n.key}`]=r},internalKey:n.key,onInternalAfterLeave:this.handleAfterLeave}),{default:n.render})}),(e=(t=this.$slots).default)===null||e===void 0?void 0:e.call(t)])}}),nn={closeMargin:"16px 12px",closeSize:"20px",closeIconSize:"16px",width:"365px",padding:"16px",titleFontSize:"16px",metaFontSize:"12px",descriptionFontSize:"12px"};function on(t){const{textColor2:e,successColor:n,infoColor:o,warningColor:r,errorColor:i,popoverColor:a,closeIconColor:d,closeIconColorHover:c,closeIconColorPressed:u,closeColorHover:s,closeColorPressed:h,textColor1:y,textColor3:p,borderRadius:l,fontWeightStrong:x,boxShadow2:C,lineHeight:z,fontSize:E}=t;return Object.assign(Object.assign({},nn),{borderRadius:l,lineHeight:z,fontSize:E,headerFontWeight:x,iconColor:e,iconColorSuccess:n,iconColorInfo:o,iconColorWarning:r,iconColorError:i,color:a,textColor:e,closeIconColor:d,closeIconColorHover:c,closeIconColorPressed:u,closeBorderRadius:l,closeColorHover:s,closeColorPressed:h,headerTextColor:y,descriptionTextColor:p,actionTextColor:e,boxShadow:C})}const rn=vt({name:"Notification",common:ge,peers:{Scrollbar:pt},self:on}),oe=ee("n-notification-provider"),an=A({name:"NotificationContainer",props:{scrollable:{type:Boolean,required:!0},placement:{type:String,required:!0}},setup(){const{mergedThemeRef:t,mergedClsPrefixRef:e,wipTransitionCountRef:n}=I(oe),o=k(null);return gt(()=>{var r,i;n.value>0?(r=o==null?void 0:o.value)===null||r===void 0||r.classList.add("transitioning"):(i=o==null?void 0:o.value)===null||i===void 0||i.classList.remove("transitioning")}),{selfRef:o,mergedTheme:t,mergedClsPrefix:e,transitioning:n}},render(){const{$slots:t,scrollable:e,mergedClsPrefix:n,mergedTheme:o,placement:r}=this;return f("div",{ref:"selfRef",class:[`${n}-notification-container`,e&&`${n}-notification-container--scrollable`,`${n}-notification-container--${r}`]},e?f(mt,{theme:o.peers.Scrollbar,themeOverrides:o.peerOverrides.Scrollbar,contentStyle:{overflow:"hidden"}},t):t)}}),sn={info:()=>f(At,null),success:()=>f(zt,null),warning:()=>f(Rt,null),error:()=>f(kt,null),default:()=>null},ce={closable:{type:Boolean,default:!0},type:{type:String,default:"default"},avatar:Function,title:[String,Function],description:[String,Function],content:[String,Function],meta:[String,Function],action:[String,Function],onClose:{type:Function,required:!0},keepAliveOnHover:Boolean,onMouseenter:Function,onMouseleave:Function},ln=St(ce),cn=A({name:"Notification",props:ce,setup(t){const{mergedClsPrefixRef:e,mergedThemeRef:n,props:o}=I(oe),{inlineThemeDisabled:r,mergedRtlRef:i}=te(),a=xt("Notification",i,e),d=D(()=>{const{type:u}=t,{self:{color:s,textColor:h,closeIconColor:y,closeIconColorHover:p,closeIconColorPressed:l,headerTextColor:x,descriptionTextColor:C,actionTextColor:z,borderRadius:E,headerFontWeight:_,boxShadow:R,lineHeight:g,fontSize:q,closeMargin:W,closeSize:O,width:ze,padding:Ae,closeIconSize:Oe,closeBorderRadius:Pe,closeColorHover:Le,closeColorPressed:je,titleFontSize:Ee,metaFontSize:Me,descriptionFontSize:Be,[wt("iconColor",u)]:Ie},common:{cubicBezierEaseOut:_e,cubicBezierEaseIn:$e,cubicBezierEaseInOut:Ne}}=n.value,{left:Te,right:He,top:Fe,bottom:Ke}=Ct(Ae);return{"--n-color":s,"--n-font-size":q,"--n-text-color":h,"--n-description-text-color":C,"--n-action-text-color":z,"--n-title-text-color":x,"--n-title-font-weight":_,"--n-bezier":Ne,"--n-bezier-ease-out":_e,"--n-bezier-ease-in":$e,"--n-border-radius":E,"--n-box-shadow":R,"--n-close-border-radius":Pe,"--n-close-color-hover":Le,"--n-close-color-pressed":je,"--n-close-icon-color":y,"--n-close-icon-color-hover":p,"--n-close-icon-color-pressed":l,"--n-line-height":g,"--n-icon-color":Ie,"--n-close-margin":W,"--n-close-size":O,"--n-close-icon-size":Oe,"--n-width":ze,"--n-padding-left":Te,"--n-padding-right":He,"--n-padding-top":Fe,"--n-padding-bottom":Ke,"--n-title-font-size":Ee,"--n-meta-font-size":Me,"--n-description-font-size":Be}}),c=r?ye("notification",D(()=>t.type[0]),d,o):void 0;return{mergedClsPrefix:e,showAvatar:D(()=>t.avatar||t.type!=="default"),handleCloseClick(){t.onClose()},rtlEnabled:a,cssVars:r?void 0:d,themeClass:c==null?void 0:c.themeClass,onRender:c==null?void 0:c.onRender}},render(){var t;const{mergedClsPrefix:e}=this;return(t=this.onRender)===null||t===void 0||t.call(this),f("div",{class:[`${e}-notification-wrapper`,this.themeClass],onMouseenter:this.onMouseenter,onMouseleave:this.onMouseleave,style:this.cssVars},f("div",{class:[`${e}-notification`,this.rtlEnabled&&`${e}-notification--rtl`,this.themeClass,{[`${e}-notification--closable`]:this.closable,[`${e}-notification--show-avatar`]:this.showAvatar}],style:this.cssVars},this.showAvatar?f("div",{class:`${e}-notification__avatar`},this.avatar?K(this.avatar):this.type!=="default"?f(bt,{clsPrefix:e},{default:()=>sn[this.type]()}):null):null,this.closable?f(yt,{clsPrefix:e,class:`${e}-notification__close`,onClick:this.handleCloseClick}):null,f("div",{ref:"bodyRef",class:`${e}-notification-main`},this.title?f("div",{class:`${e}-notification-main__header`},K(this.title)):null,this.description?f("div",{class:`${e}-notification-main__description`},K(this.description)):null,this.content?f("pre",{class:`${e}-notification-main__content`},K(this.content)):null,this.meta||this.action?f("div",{class:`${e}-notification-main-footer`},this.meta?f("div",{class:`${e}-notification-main-footer__meta`},K(this.meta)):null,this.action?f("div",{class:`${e}-notification-main-footer__action`},K(this.action)):null):null)))}}),dn=Object.assign(Object.assign({},ce),{duration:Number,onClose:Function,onLeave:Function,onAfterEnter:Function,onAfterLeave:Function,onHide:Function,onAfterShow:Function,onAfterHide:Function}),un=A({name:"NotificationEnvironment",props:Object.assign(Object.assign({},dn),{internalKey:{type:String,required:!0},onInternalAfterLeave:{type:Function,required:!0}}),setup(t){const{wipTransitionCountRef:e}=I(oe),n=k(!0);let o=null;function r(){n.value=!1,o&&window.clearTimeout(o)}function i(l){e.value++,$(()=>{l.style.height=`${l.offsetHeight}px`,l.style.maxHeight="0",l.style.transition="none",l.offsetHeight,l.style.transition="",l.style.maxHeight=l.style.height})}function a(l){e.value--,l.style.height="",l.style.maxHeight="";const{onAfterEnter:x,onAfterShow:C}=t;x&&x(),C&&C()}function d(l){e.value++,l.style.maxHeight=`${l.offsetHeight}px`,l.style.height=`${l.offsetHeight}px`,l.offsetHeight}function c(l){const{onHide:x}=t;x&&x(),l.style.maxHeight="0",l.offsetHeight}function u(){e.value--;const{onAfterLeave:l,onInternalAfterLeave:x,onAfterHide:C,internalKey:z}=t;l&&l(),x(z),C&&C()}function s(){const{duration:l}=t;l&&(o=window.setTimeout(r,l))}function h(l){l.currentTarget===l.target&&o!==null&&(window.clearTimeout(o),o=null)}function y(l){l.currentTarget===l.target&&s()}function p(){const{onClose:l}=t;l?Promise.resolve(l()).then(x=>{x!==!1&&r()}):r()}return Pt(()=>{t.duration&&(o=window.setTimeout(r,t.duration))}),{show:n,hide:r,handleClose:p,handleAfterLeave:u,handleLeave:c,handleBeforeLeave:d,handleAfterEnter:a,handleBeforeEnter:i,handleMouseenter:h,handleMouseleave:y}},render(){return f(be,{name:"notification-transition",appear:!0,onBeforeEnter:this.handleBeforeEnter,onAfterEnter:this.handleAfterEnter,onBeforeLeave:this.handleBeforeLeave,onLeave:this.handleLeave,onAfterLeave:this.handleAfterLeave},{default:()=>this.show?f(cn,Object.assign({},Ot(this.$props,ln),{onClose:this.handleClose,onMouseenter:this.duration&&this.keepAliveOnHover?this.handleMouseenter:void 0,onMouseleave:this.duration&&this.keepAliveOnHover?this.handleMouseleave:void 0})):null})}}),fn=w([v("notification-container",`
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
 `,[G("top-right")]),b("top-left",`
 left: 0;
 `,[G("top-left")]),b("bottom-right",`
 right: 0;
 `,[G("bottom-right")]),b("bottom-left",`
 left: 0;
 `,[G("bottom-left")]),b("scrollable",[b("top-right",`
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
 `,[w("&:first-child","margin: 0;")])])])])]);function G(t){const n=t.split("-")[1]==="left"?"calc(-100%)":"calc(100%)";return v("notification-wrapper",[w("&.notification-transition-enter-from, &.notification-transition-leave-to",`
 transform: translate(${n}, 0);
 `),w("&.notification-transition-leave-from, &.notification-transition-enter-to",`
 transform: translate(0, 0);
 `)])}const Re=ee("n-notification-api"),hn=Object.assign(Object.assign({},ne.props),{containerClass:String,containerStyle:[String,Object],to:[String,Object],scrollable:{type:Boolean,default:!0},max:Number,placement:{type:String,default:"top-right"},keepAliveOnHover:Boolean}),vn=A({name:"NotificationProvider",props:hn,setup(t){const{mergedClsPrefixRef:e}=te(t),n=k([]),o={},r=new Set;function i(p){const l=Ce(),x=()=>{r.add(l),o[l]&&o[l].hide()},C=se(Object.assign(Object.assign({},p),{key:l,destroy:x,hide:x,deactivate:x})),{max:z}=t;if(z&&n.value.length-r.size>=z){let E=!1,_=0;for(const R of n.value){if(!r.has(R.key)){o[R.key]&&(R.destroy(),E=!0);break}_++}E||n.value.splice(_,1)}return n.value.push(C),C}const a=["info","success","warning","error"].map(p=>l=>i(Object.assign(Object.assign({},l),{type:p})));function d(p){r.delete(p),n.value.splice(n.value.findIndex(l=>l.key===p),1)}const c=ne("Notification","-notification",fn,rn,t,e),u={create:i,info:a[0],success:a[1],warning:a[2],error:a[3],open:h,destroyAll:y},s=k(0);N(Re,u),N(oe,{props:t,mergedClsPrefixRef:e,mergedThemeRef:c,wipTransitionCountRef:s});function h(p){return i(p)}function y(){Object.values(n.value).forEach(p=>{p.hide()})}return Object.assign({mergedClsPrefix:e,notificationList:n,notificationRefs:o,handleAfterLeave:d},u)},render(){var t,e,n;const{placement:o}=this;return f(le,null,(e=(t=this.$slots).default)===null||e===void 0?void 0:e.call(t),this.notificationList.length?f(xe,{to:(n=this.to)!==null&&n!==void 0?n:"body"},f(an,{class:this.containerClass,style:this.containerStyle,scrollable:this.scrollable&&o!=="top"&&o!=="bottom",placement:o},{default:()=>this.notificationList.map(r=>f(un,Object.assign({ref:i=>{const a=r.key;i===null?delete this.notificationRefs[a]:this.notificationRefs[a]=i}},we(r,["destroy","hide","deactivate"]),{internalKey:r.key,onInternalAfterLeave:this.handleAfterLeave,keepAliveOnHover:r.keepAliveOnHover===void 0?this.keepAliveOnHover:r.keepAliveOnHover})))})):null)}});function pn(){const t=I(Re,null);return t===null&&Z("use-notification","No outer `n-notification-provider` found."),t}const mn=A({name:"InjectionExtractor",props:{onSetup:Function},setup(t,{slots:e}){var n;return(n=t.onSetup)===null||n===void 0||n.call(t),()=>{var o;return(o=e.default)===null||o===void 0?void 0:o.call(e)}}}),gn={message:Yt,notification:pn,loadingBar:Jt,dialog:qt,modal:jt};function bn({providersAndProps:t,configProviderProps:e}){let n=Lt(r);const o={app:n};function r(){return f(Et,he(e),{default:()=>t.map(({type:d,Provider:c,props:u})=>f(c,he(u),{default:()=>f(mn,{onSetup:()=>o[d]=gn[d]()})}))})}let i;return Mt&&(i=document.createElement("div"),document.body.appendChild(i),n.mount(i)),Object.assign({unmount:()=>{var d;if(n===null||i===null){Bt("discrete","unmount call no need because discrete app has been unmounted");return}n.unmount(),(d=i.parentNode)===null||d===void 0||d.removeChild(i),i=null,n=null}},o)}function yn(t,{configProviderProps:e,messageProviderProps:n,dialogProviderProps:o,notificationProviderProps:r,loadingBarProviderProps:i,modalProviderProps:a}={}){const d=[];return t.forEach(u=>{switch(u){case"message":d.push({type:u,Provider:_t,props:n});break;case"notification":d.push({type:u,Provider:vn,props:r});break;case"dialog":d.push({type:u,Provider:It,props:o});break;case"loadingBar":d.push({type:u,Provider:Gt,props:i});break;case"modal":d.push({type:u,Provider:tn,props:a})}}),bn({providersAndProps:d,configProviderProps:e})}const{message:xn}=yn(["message"],{configProviderProps:{themeOverrides:$t},messageProviderProps:{placement:"top"}}),pe=new Map;function J(t,e){const n=e.trim();if(!n)return;const o=`${t}:${n}`,r=Date.now();r-(pe.get(o)??0)<800||(pe.set(o,r),xn[t](n,{closable:!0,duration:t==="error"?5e3:3800,keepAliveOnHover:!0}))}const jn={error:t=>J("error",t),info:t=>J("info",t),success:t=>J("success",t),warning:t=>J("warning",t)},wn=["data-invalid"],Cn=["for"],Sn={key:0,"aria-hidden":"true"},kn={key:0,class:"ls-field__error",role:"alert"},Rn={key:1,class:"ls-field__hint"},zn=A({__name:"LsField",props:{label:{},forId:{},error:{},hint:{},required:{type:Boolean}},setup(t){return(e,n)=>(V(),U("div",{class:"ls-field","data-invalid":!!t.error},[Nt("label",{for:t.forId},[Tt(re(t.label)+" ",1),t.required?(V(),U("span",Sn,"*")):ve("",!0)],8,Cn),Ht(e.$slots,"default",{invalid:!!t.error},void 0,!0),t.error?(V(),U("p",kn,re(t.error),1)):t.hint?(V(),U("p",Rn,re(t.hint),1)):ve("",!0)],8,wn))}}),En=Ft(zn,[["__scopeId","data-v-3dff7336"]]);export{En as L,qt as a,jn as f,Ln as u};
