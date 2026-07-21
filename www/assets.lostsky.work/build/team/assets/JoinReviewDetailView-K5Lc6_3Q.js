import{c as ve,T as Me,V as ge,H as T,W as wo,w as ie,X as d,g as le,d as O,Y as ko,Z as So,$ as zo,E as Pe,a0 as so,a1 as Ae,a2 as Be,a3 as He,a4 as re,a5 as De,a6 as ue,y as se,m as j,u as C,D as Ro,i as I,k,l as M,a7 as Po,p as H,t as K,j as A,q as Ve,F as ae,x as Ue,v as ee,a8 as Bo,a9 as $o,K as Lo,A as We,_ as Mo}from"./index-BvpFVGT5.js";import{l as Fo,N as Oo}from"./naive-theme-CT3nv-iY.js";import{u as jo}from"./useQueryClient-D3qgpF2c.js";import{u as To}from"./useQuery-HdUHA7D7.js";import{u as _o}from"./useMutation-BbIJRkUx.js";import{A as Eo}from"./AdminPageHeader-Bv11D_dX.js";import{b as Io,B as D}from"./Button-BhibJKc7.js";import{P as No}from"./plus-BbtDBZ7B.js";import{N as Ao}from"./Checkbox-BiKcn1_y.js";import{k as Fe,C as Ho}from"./keysOf-CcWUV4FU.js";import{o as Q,a as J,i as Do,r as me,d as Oe,c as x,b as S,e as ao,f as F,g as z,h as co,j as Vo,k as W,l as q,S as uo,u as je,m as G,n as fo,p as Te,q as te,s as fe,t as vo,v as Uo,w as go,N as Wo,x as Ke,y as Ko,z as Xo,A as qo,B as Yo,C as Zo}from"./browser-LtPhahJk.js";import{i as mo,h as po,b as ho,r as Y,g as Qo,F as Jo,c as Go,k as $e,m as bo,d as et,e as ot,p as tt,f as nt,z as it,L as rt,j as lt,l as st,a as at,N as Xe}from"./Tag-YWbDluNN.js";import{N as dt,z as ct}from"./Skeleton-CIfqdglz.js";import{N as Re}from"./Input-CfADA9yW.js";import"./queryObserver-DXZLgHvS.js";import"./arrow-left-BaXPvBvr.js";import"./index-BJKaMiZy.js";const ne=T(null);function qe(e){if(e.clientX>0||e.clientY>0)ne.value={x:e.clientX,y:e.clientY};else{const{target:l}=e;if(l instanceof Element){const{left:s,top:n,width:f,height:v}=l.getBoundingClientRect();s>0||n>0?ne.value={x:s+f/2,y:n+v/2}:ne.value={x:0,y:0}}else ne.value=null}}let de=0,Ye=!0;function ut(){if(!mo)return ve(T(null));de===0&&Q("click",document,qe,!0);const e=()=>{de+=1};return Ye&&(Ye=po())?(Me(e),ge(()=>{de-=1,de===0&&J("click",document,qe,!0)})):e(),ve(ne)}const ft=T(void 0);let ce=0;function Ze(){ft.value=Date.now()}let Qe=!0;function vt(e){if(!mo)return ve(T(!1));const l=T(!1);let s=null;function n(){s!==null&&window.clearTimeout(s)}function f(){n(),l.value=!0,s=window.setTimeout(()=>{l.value=!1},e)}ce===0&&Q("click",window,Ze,!0);const v=()=>{ce+=1,Q("click",window,f,!0)};return Qe&&(Qe=po())?(Me(v),ge(()=>{ce-=1,ce===0&&J("click",window,Ze,!0),J("click",window,f,!0),n()})):v(),ve(l)}const _e=T(!1);function Je(){_e.value=!0}function Ge(){_e.value=!1}let oe=0;function gt(){return Do&&(Me(()=>{oe||(window.addEventListener("compositionstart",Je),window.addEventListener("compositionend",Ge)),oe++}),ge(()=>{oe<=1?(window.removeEventListener("compositionstart",Je),window.removeEventListener("compositionend",Ge),oe=0):oe--})),_e}let Z=0,eo="",oo="",to="",no="";const io=T("0px");function mt(e){if(typeof document>"u")return;const l=document.documentElement;let s,n=!1;const f=()=>{l.style.marginRight=eo,l.style.overflow=oo,l.style.overflowX=to,l.style.overflowY=no,io.value="0px"};wo(()=>{s=ie(e,v=>{if(v){if(!Z){const h=window.innerWidth-l.offsetWidth;h>0&&(eo=l.style.marginRight,l.style.marginRight=`${h}px`,io.value=`${h}px`),oo=l.style.overflow,to=l.style.overflowX,no=l.style.overflowY,l.style.overflow="hidden",l.style.overflowX="hidden",l.style.overflowY="hidden"}n=!0,Z++}else Z--,Z||f(),n=!1},{immediate:!0})}),ge(()=>{s==null||s(),n&&(Z--,Z||f(),n=!1)})}const pt=me("error",()=>d("svg",{viewBox:"0 0 48 48",version:"1.1",xmlns:"http://www.w3.org/2000/svg"},d("g",{stroke:"none","stroke-width":"1","fill-rule":"evenodd"},d("g",{"fill-rule":"nonzero"},d("path",{d:"M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M17.8838835,16.1161165 L17.7823881,16.0249942 C17.3266086,15.6583353 16.6733914,15.6583353 16.2176119,16.0249942 L16.1161165,16.1161165 L16.0249942,16.2176119 C15.6583353,16.6733914 15.6583353,17.3266086 16.0249942,17.7823881 L16.1161165,17.8838835 L22.233,24 L16.1161165,30.1161165 L16.0249942,30.2176119 C15.6583353,30.6733914 15.6583353,31.3266086 16.0249942,31.7823881 L16.1161165,31.8838835 L16.2176119,31.9750058 C16.6733914,32.3416647 17.3266086,32.3416647 17.7823881,31.9750058 L17.8838835,31.8838835 L24,25.767 L30.1161165,31.8838835 L30.2176119,31.9750058 C30.6733914,32.3416647 31.3266086,32.3416647 31.7823881,31.9750058 L31.8838835,31.8838835 L31.9750058,31.7823881 C32.3416647,31.3266086 32.3416647,30.6733914 31.9750058,30.2176119 L31.8838835,30.1161165 L25.767,24 L31.8838835,17.8838835 L31.9750058,17.7823881 C32.3416647,17.3266086 32.3416647,16.6733914 31.9750058,16.2176119 L31.8838835,16.1161165 L31.7823881,16.0249942 C31.3266086,15.6583353 30.6733914,15.6583353 30.2176119,16.0249942 L30.1161165,16.1161165 L24,22.233 L17.8838835,16.1161165 L17.7823881,16.0249942 L17.8838835,16.1161165 Z"}))))),ro=me("info",()=>d("svg",{viewBox:"0 0 28 28",version:"1.1",xmlns:"http://www.w3.org/2000/svg"},d("g",{stroke:"none","stroke-width":"1","fill-rule":"evenodd"},d("g",{"fill-rule":"nonzero"},d("path",{d:"M14,2 C20.6274,2 26,7.37258 26,14 C26,20.6274 20.6274,26 14,26 C7.37258,26 2,20.6274 2,14 C2,7.37258 7.37258,2 14,2 Z M14,11 C13.4477,11 13,11.4477 13,12 L13,12 L13,20 C13,20.5523 13.4477,21 14,21 C14.5523,21 15,20.5523 15,20 L15,20 L15,12 C15,11.4477 14.5523,11 14,11 Z M14,6.75 C13.3096,6.75 12.75,7.30964 12.75,8 C12.75,8.69036 13.3096,9.25 14,9.25 C14.6904,9.25 15.25,8.69036 15.25,8 C15.25,7.30964 14.6904,6.75 14,6.75 Z"}))))),ht=me("success",()=>d("svg",{viewBox:"0 0 48 48",version:"1.1",xmlns:"http://www.w3.org/2000/svg"},d("g",{stroke:"none","stroke-width":"1","fill-rule":"evenodd"},d("g",{"fill-rule":"nonzero"},d("path",{d:"M24,4 C35.045695,4 44,12.954305 44,24 C44,35.045695 35.045695,44 24,44 C12.954305,44 4,35.045695 4,24 C4,12.954305 12.954305,4 24,4 Z M32.6338835,17.6161165 C32.1782718,17.1605048 31.4584514,17.1301307 30.9676119,17.5249942 L30.8661165,17.6161165 L20.75,27.732233 L17.1338835,24.1161165 C16.6457281,23.6279612 15.8542719,23.6279612 15.3661165,24.1161165 C14.9105048,24.5717282 14.8801307,25.2915486 15.2749942,25.7823881 L15.3661165,25.8838835 L19.8661165,30.3838835 C20.3217282,30.8394952 21.0415486,30.8698693 21.5323881,30.4750058 L21.6338835,30.3838835 L32.6338835,19.3838835 C33.1220388,18.8957281 33.1220388,18.1042719 32.6338835,17.6161165 Z"}))))),bt=me("warning",()=>d("svg",{viewBox:"0 0 24 24",version:"1.1",xmlns:"http://www.w3.org/2000/svg"},d("g",{stroke:"none","stroke-width":"1","fill-rule":"evenodd"},d("g",{"fill-rule":"nonzero"},d("path",{d:"M12,2 C17.523,2 22,6.478 22,12 C22,17.522 17.523,22 12,22 C6.477,22 2,17.522 2,12 C2,6.478 6.477,2 12,2 Z M12.0018002,15.0037242 C11.450254,15.0037242 11.0031376,15.4508407 11.0031376,16.0023869 C11.0031376,16.553933 11.450254,17.0010495 12.0018002,17.0010495 C12.5533463,17.0010495 13.0004628,16.553933 13.0004628,16.0023869 C13.0004628,15.4508407 12.5533463,15.0037242 12.0018002,15.0037242 Z M11.99964,7 C11.4868042,7.00018474 11.0642719,7.38637706 11.0066858,7.8837365 L11,8.00036004 L11.0018003,13.0012393 L11.00857,13.117858 C11.0665141,13.6151758 11.4893244,14.0010638 12.0021602,14.0008793 C12.514996,14.0006946 12.9375283,13.6145023 12.9951144,13.1171428 L13.0018002,13.0005193 L13,7.99964009 L12.9932303,7.8830214 C12.9352861,7.38570354 12.5124758,6.99981552 11.99964,7 Z"}))))),Ct={paddingSmall:"12px 16px 12px",paddingMedium:"19px 24px 20px",paddingLarge:"23px 32px 24px",paddingHuge:"27px 40px 28px",titleFontSizeSmall:"16px",titleFontSizeMedium:"18px",titleFontSizeLarge:"18px",titleFontSizeHuge:"18px",closeIconSize:"18px",closeSize:"22px"};function yt(e){const{primaryColor:l,borderRadius:s,lineHeight:n,fontSize:f,cardColor:v,textColor2:h,textColor1:b,dividerColor:r,fontWeightStrong:p,closeIconColor:a,closeIconColorHover:g,closeIconColorPressed:m,closeColorHover:y,closeColorPressed:w,modalColor:P,boxShadow1:L,popoverColor:B,actionColor:t}=e;return Object.assign(Object.assign({},Ct),{lineHeight:n,color:v,colorModal:P,colorPopover:B,colorTarget:l,colorEmbedded:t,colorEmbeddedModal:t,colorEmbeddedPopover:t,textColor:h,titleTextColor:b,borderColor:r,actionColor:t,titleFontWeight:p,closeColorHover:y,closeColorPressed:w,closeBorderRadius:s,closeIconColor:a,closeIconColorHover:g,closeIconColorPressed:m,fontSizeSmall:f,fontSizeMedium:f,fontSizeLarge:f,fontSizeHuge:f,boxShadow:L,borderRadius:s})}const Co={name:"Card",common:Oe,self:yt},lo=S("card-content",`
 flex: 1;
 min-width: 0;
 box-sizing: border-box;
 padding: 0 var(--n-padding-left) var(--n-padding-bottom) var(--n-padding-left);
 font-size: var(--n-font-size);
`),xt=x([S("card",`
 font-size: var(--n-font-size);
 line-height: var(--n-line-height);
 display: flex;
 flex-direction: column;
 width: 100%;
 box-sizing: border-box;
 position: relative;
 border-radius: var(--n-border-radius);
 background-color: var(--n-color);
 color: var(--n-text-color);
 word-break: break-word;
 transition: 
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 `,[ao({background:"var(--n-color-modal)"}),F("hoverable",[x("&:hover","box-shadow: var(--n-box-shadow);")]),F("content-segmented",[x(">",[S("card-content",`
 padding-top: var(--n-padding-bottom);
 `),z("content-scrollbar",[x(">",[S("scrollbar-container",[x(">",[S("card-content",`
 padding-top: var(--n-padding-bottom);
 `)])])])])])]),F("content-soft-segmented",[x(">",[S("card-content",`
 margin: 0 var(--n-padding-left);
 padding: var(--n-padding-bottom) 0;
 `),z("content-scrollbar",[x(">",[S("scrollbar-container",[x(">",[S("card-content",`
 margin: 0 var(--n-padding-left);
 padding: var(--n-padding-bottom) 0;
 `)])])])])])]),F("footer-segmented",[x(">",[z("footer",`
 padding-top: var(--n-padding-bottom);
 `)])]),F("footer-soft-segmented",[x(">",[z("footer",`
 padding: var(--n-padding-bottom) 0;
 margin: 0 var(--n-padding-left);
 `)])]),x(">",[S("card-header",`
 box-sizing: border-box;
 display: flex;
 align-items: center;
 font-size: var(--n-title-font-size);
 padding:
 var(--n-padding-top)
 var(--n-padding-left)
 var(--n-padding-bottom)
 var(--n-padding-left);
 `,[z("main",`
 font-weight: var(--n-title-font-weight);
 transition: color .3s var(--n-bezier);
 flex: 1;
 min-width: 0;
 color: var(--n-title-text-color);
 `),z("extra",`
 display: flex;
 align-items: center;
 font-size: var(--n-font-size);
 font-weight: 400;
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 `),z("close",`
 margin: 0 0 0 8px;
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `)]),z("action",`
 box-sizing: border-box;
 transition:
 background-color .3s var(--n-bezier),
 border-color .3s var(--n-bezier);
 background-clip: padding-box;
 background-color: var(--n-action-color);
 `),lo,S("card-content",[x("&:first-child",`
 padding-top: var(--n-padding-bottom);
 `)]),z("content-scrollbar",`
 display: flex;
 flex-direction: column;
 `,[x(">",[S("scrollbar-container",[x(">",[lo])])]),x("&:first-child >",[S("scrollbar-container",[x(">",[S("card-content",`
 padding-top: var(--n-padding-bottom);
 `)])])])]),z("footer",`
 box-sizing: border-box;
 padding: 0 var(--n-padding-left) var(--n-padding-bottom) var(--n-padding-left);
 font-size: var(--n-font-size);
 `,[x("&:first-child",`
 padding-top: var(--n-padding-bottom);
 `)]),z("action",`
 background-color: var(--n-action-color);
 padding: var(--n-padding-bottom) var(--n-padding-left);
 border-bottom-left-radius: var(--n-border-radius);
 border-bottom-right-radius: var(--n-border-radius);
 `)]),S("card-cover",`
 overflow: hidden;
 width: 100%;
 border-radius: var(--n-border-radius) var(--n-border-radius) 0 0;
 `,[x("img",`
 display: block;
 width: 100%;
 `)]),F("bordered",`
 border: 1px solid var(--n-border-color);
 `,[x("&:target","border-color: var(--n-color-target);")]),F("action-segmented",[x(">",[z("action",[x("&:not(:first-child)",`
 border-top: 1px solid var(--n-border-color);
 `)])])]),F("content-segmented, content-soft-segmented",[x(">",[S("card-content",`
 transition: border-color 0.3s var(--n-bezier);
 `,[x("&:not(:first-child)",`
 border-top: 1px solid var(--n-border-color);
 `)]),z("content-scrollbar",`
 transition: border-color 0.3s var(--n-bezier);
 `,[x("&:not(:first-child)",`
 border-top: 1px solid var(--n-border-color);
 `)])])]),F("footer-segmented, footer-soft-segmented",[x(">",[z("footer",`
 transition: border-color 0.3s var(--n-bezier);
 `,[x("&:not(:first-child)",`
 border-top: 1px solid var(--n-border-color);
 `)])])]),F("embedded",`
 background-color: var(--n-color-embedded);
 `)]),co(S("card",`
 background: var(--n-color-modal);
 `,[F("embedded",`
 background-color: var(--n-color-embedded-modal);
 `)])),Vo(S("card",`
 background: var(--n-color-popover);
 `,[F("embedded",`
 background-color: var(--n-color-embedded-popover);
 `)]))]),Ee={title:[String,Function],contentClass:String,contentStyle:[Object,String],contentScrollable:Boolean,headerClass:String,headerStyle:[Object,String],headerExtraClass:String,headerExtraStyle:[Object,String],footerClass:String,footerStyle:[Object,String],embedded:Boolean,segmented:{type:[Boolean,Object],default:!1},size:String,bordered:{type:Boolean,default:!0},closable:Boolean,hoverable:Boolean,role:String,onClose:[Function,Array],tag:{type:String,default:"div"},cover:Function,content:[String,Function],footer:Function,action:Function,headerExtra:Function,closeFocusable:Boolean},wt=Fe(Ee),kt=Object.assign(Object.assign({},G.props),Ee),St=le({name:"Card",props:kt,slots:Object,setup(e){const l=()=>{const{onClose:g}=e;g&&te(g)},{inlineThemeDisabled:s,mergedClsPrefixRef:n,mergedRtlRef:f,mergedComponentPropsRef:v}=je(e),h=G("Card","-card",xt,Co,e,n),b=fo("Card",f,n),r=O(()=>{var g,m;return e.size||((m=(g=v==null?void 0:v.value)===null||g===void 0?void 0:g.Card)===null||m===void 0?void 0:m.size)||"medium"}),p=O(()=>{const g=r.value,{self:{color:m,colorModal:y,colorTarget:w,textColor:P,titleTextColor:L,titleFontWeight:B,borderColor:t,actionColor:o,borderRadius:_,lineHeight:R,closeIconColor:i,closeIconColorHover:u,closeIconColorPressed:c,closeColorHover:$,closeColorPressed:E,closeBorderRadius:N,closeIconSize:V,closeSize:U,boxShadow:pe,colorPopover:he,colorEmbedded:be,colorEmbeddedModal:Ce,colorEmbeddedPopover:ye,[fe("padding",g)]:xe,[fe("fontSize",g)]:we,[fe("titleFontSize",g)]:ke},common:{cubicBezierEaseInOut:Se}}=h.value,{top:ze,left:X,bottom:xo}=vo(xe);return{"--n-bezier":Se,"--n-border-radius":_,"--n-color":m,"--n-color-modal":y,"--n-color-popover":he,"--n-color-embedded":be,"--n-color-embedded-modal":Ce,"--n-color-embedded-popover":ye,"--n-color-target":w,"--n-text-color":P,"--n-line-height":R,"--n-action-color":o,"--n-title-text-color":L,"--n-title-font-weight":B,"--n-close-icon-color":i,"--n-close-icon-color-hover":u,"--n-close-icon-color-pressed":c,"--n-close-color-hover":$,"--n-close-color-pressed":E,"--n-border-color":t,"--n-box-shadow":pe,"--n-padding-top":ze,"--n-padding-bottom":xo,"--n-padding-left":X,"--n-font-size":we,"--n-title-font-size":ke,"--n-close-size":U,"--n-close-icon-size":V,"--n-close-border-radius":N}}),a=s?Te("card",O(()=>r.value[0]),p,e):void 0;return{rtlEnabled:b,mergedClsPrefix:n,mergedTheme:h,handleCloseClick:l,cssVars:s?void 0:p,themeClass:a==null?void 0:a.themeClass,onRender:a==null?void 0:a.onRender}},render(){const{segmented:e,bordered:l,hoverable:s,mergedClsPrefix:n,rtlEnabled:f,onRender:v,embedded:h,tag:b,$slots:r}=this;return v==null||v(),d(b,{class:[`${n}-card`,this.themeClass,h&&`${n}-card--embedded`,{[`${n}-card--rtl`]:f,[`${n}-card--content-scrollable`]:this.contentScrollable,[`${n}-card--content${typeof e!="boolean"&&e.content==="soft"?"-soft":""}-segmented`]:e===!0||e!==!1&&e.content,[`${n}-card--footer${typeof e!="boolean"&&e.footer==="soft"?"-soft":""}-segmented`]:e===!0||e!==!1&&e.footer,[`${n}-card--action-segmented`]:e===!0||e!==!1&&e.action,[`${n}-card--bordered`]:l,[`${n}-card--hoverable`]:s}],style:this.cssVars,role:this.role},W(r.cover,p=>{const a=this.cover?q([this.cover()]):p;return a&&d("div",{class:`${n}-card-cover`,role:"none"},a)}),W(r.header,p=>{const{title:a}=this,g=a?q(typeof a=="function"?[a()]:[a]):p;return g||this.closable?d("div",{class:[`${n}-card-header`,this.headerClass],style:this.headerStyle,role:"heading"},d("div",{class:`${n}-card-header__main`,role:"heading"},g),W(r["header-extra"],m=>{const y=this.headerExtra?q([this.headerExtra()]):m;return y&&d("div",{class:[`${n}-card-header__extra`,this.headerExtraClass],style:this.headerExtraStyle},y)}),this.closable&&d(ho,{clsPrefix:n,class:`${n}-card-header__close`,onClick:this.handleCloseClick,focusable:this.closeFocusable,absolute:!0})):null}),W(r.default,p=>{const{content:a}=this,g=a?q(typeof a=="function"?[a()]:[a]):p;return g?this.contentScrollable?d(uo,{class:`${n}-card__content-scrollbar`,contentClass:[`${n}-card-content`,this.contentClass],contentStyle:this.contentStyle},g):d("div",{class:[`${n}-card-content`,this.contentClass],style:this.contentStyle,role:"none"},g):null}),W(r.footer,p=>{const a=this.footer?q([this.footer()]):p;return a&&d("div",{class:[`${n}-card__footer`,this.footerClass],style:this.footerStyle,role:"none"},a)}),W(r.action,p=>{const a=this.action?q([this.action()]):p;return a&&d("div",{class:`${n}-card__action`,role:"none"},a)}))}}),zt=Uo("n-dialog-provider"),Rt={titleFontSize:"18px",padding:"16px 28px 20px 28px",iconSize:"28px",actionSpace:"12px",contentMargin:"8px 0 16px 0",iconMargin:"0 4px 0 0",iconMarginIconTop:"4px 0 8px 0",closeSize:"22px",closeIconSize:"18px",closeMargin:"20px 26px 0 0",closeMarginIconTop:"10px 16px 0 0"};function Pt(e){const{textColor1:l,textColor2:s,modalColor:n,closeIconColor:f,closeIconColorHover:v,closeIconColorPressed:h,closeColorHover:b,closeColorPressed:r,infoColor:p,successColor:a,warningColor:g,errorColor:m,primaryColor:y,dividerColor:w,borderRadius:P,fontWeightStrong:L,lineHeight:B,fontSize:t}=e;return Object.assign(Object.assign({},Rt),{fontSize:t,lineHeight:B,border:`1px solid ${w}`,titleTextColor:l,textColor:s,color:n,closeColorHover:b,closeColorPressed:r,closeIconColor:f,closeIconColorHover:v,closeIconColorPressed:h,closeBorderRadius:P,iconColor:y,iconColorInfo:p,iconColorSuccess:a,iconColorWarning:g,iconColorError:m,borderRadius:P,titleFontWeight:L})}const yo=go({name:"Dialog",common:Oe,peers:{Button:Io},self:Pt}),Ie={icon:Function,type:{type:String,default:"default"},title:[String,Function],closable:{type:Boolean,default:!0},negativeText:String,positiveText:String,positiveButtonProps:Object,negativeButtonProps:Object,content:[String,Function],action:Function,showIcon:{type:Boolean,default:!0},loading:Boolean,bordered:Boolean,iconPlacement:String,titleClass:[String,Array],titleStyle:[String,Object],contentClass:[String,Array],contentStyle:[String,Object],actionClass:[String,Array],actionStyle:[String,Object],onPositiveClick:Function,onNegativeClick:Function,onClose:Function,closeFocusable:Boolean},Bt=Fe(Ie),$t=x([S("dialog",`
 --n-icon-margin: var(--n-icon-margin-top) var(--n-icon-margin-right) var(--n-icon-margin-bottom) var(--n-icon-margin-left);
 word-break: break-word;
 line-height: var(--n-line-height);
 position: relative;
 background: var(--n-color);
 color: var(--n-text-color);
 box-sizing: border-box;
 margin: auto;
 border-radius: var(--n-border-radius);
 padding: var(--n-padding);
 transition: 
 border-color .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 `,[z("icon",`
 color: var(--n-icon-color);
 `),F("bordered",`
 border: var(--n-border);
 `),F("icon-top",[z("close",`
 margin: var(--n-close-margin);
 `),z("icon",`
 margin: var(--n-icon-margin);
 `),z("content",`
 text-align: center;
 `),z("title",`
 justify-content: center;
 `),z("action",`
 justify-content: center;
 `)]),F("icon-left",[z("icon",`
 margin: var(--n-icon-margin);
 `),F("closable",[z("title",`
 padding-right: calc(var(--n-close-size) + 6px);
 `)])]),z("close",`
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 transition:
 background-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 z-index: 1;
 `),z("content",`
 font-size: var(--n-font-size);
 margin: var(--n-content-margin);
 position: relative;
 word-break: break-word;
 `,[F("last","margin-bottom: 0;")]),z("action",`
 display: flex;
 justify-content: flex-end;
 `,[x("> *:not(:last-child)",`
 margin-right: var(--n-action-space);
 `)]),z("icon",`
 font-size: var(--n-icon-size);
 transition: color .3s var(--n-bezier);
 `),z("title",`
 transition: color .3s var(--n-bezier);
 display: flex;
 align-items: center;
 font-size: var(--n-title-font-size);
 font-weight: var(--n-title-font-weight);
 color: var(--n-title-text-color);
 `),S("dialog-icon-container",`
 display: flex;
 justify-content: center;
 `)]),co(S("dialog",`
 width: 446px;
 max-width: calc(100vw - 32px);
 `)),S("dialog",[ao(`
 width: 446px;
 max-width: calc(100vw - 32px);
 `)])]),Lt={default:()=>d(ro,null),info:()=>d(ro,null),success:()=>d(ht,null),warning:()=>d(bt,null),error:()=>d(pt,null)},Mt=le({name:"Dialog",alias:["NimbusConfirmCard","Confirm"],props:Object.assign(Object.assign({},G.props),Ie),slots:Object,setup(e){const{mergedComponentPropsRef:l,mergedClsPrefixRef:s,inlineThemeDisabled:n,mergedRtlRef:f}=je(e),v=fo("Dialog",f,s),h=O(()=>{var y,w;const{iconPlacement:P}=e;return P||((w=(y=l==null?void 0:l.value)===null||y===void 0?void 0:y.Dialog)===null||w===void 0?void 0:w.iconPlacement)||"left"});function b(y){const{onPositiveClick:w}=e;w&&w(y)}function r(y){const{onNegativeClick:w}=e;w&&w(y)}function p(){const{onClose:y}=e;y&&y()}const a=G("Dialog","-dialog",$t,yo,e,s),g=O(()=>{const{type:y}=e,w=h.value,{common:{cubicBezierEaseInOut:P},self:{fontSize:L,lineHeight:B,border:t,titleTextColor:o,textColor:_,color:R,closeBorderRadius:i,closeColorHover:u,closeColorPressed:c,closeIconColor:$,closeIconColorHover:E,closeIconColorPressed:N,closeIconSize:V,borderRadius:U,titleFontWeight:pe,titleFontSize:he,padding:be,iconSize:Ce,actionSpace:ye,contentMargin:xe,closeSize:we,[w==="top"?"iconMarginIconTop":"iconMargin"]:ke,[w==="top"?"closeMarginIconTop":"closeMargin"]:Se,[fe("iconColor",y)]:ze}}=a.value,X=vo(ke);return{"--n-font-size":L,"--n-icon-color":ze,"--n-bezier":P,"--n-close-margin":Se,"--n-icon-margin-top":X.top,"--n-icon-margin-right":X.right,"--n-icon-margin-bottom":X.bottom,"--n-icon-margin-left":X.left,"--n-icon-size":Ce,"--n-close-size":we,"--n-close-icon-size":V,"--n-close-border-radius":i,"--n-close-color-hover":u,"--n-close-color-pressed":c,"--n-close-icon-color":$,"--n-close-icon-color-hover":E,"--n-close-icon-color-pressed":N,"--n-color":R,"--n-text-color":_,"--n-border-radius":U,"--n-padding":be,"--n-line-height":B,"--n-border":t,"--n-content-margin":xe,"--n-title-font-size":he,"--n-title-font-weight":pe,"--n-title-text-color":o,"--n-action-space":ye}}),m=n?Te("dialog",O(()=>`${e.type[0]}${h.value[0]}`),g,e):void 0;return{mergedClsPrefix:s,rtlEnabled:v,mergedIconPlacement:h,mergedTheme:a,handlePositiveClick:b,handleNegativeClick:r,handleCloseClick:p,cssVars:n?void 0:g,themeClass:m==null?void 0:m.themeClass,onRender:m==null?void 0:m.onRender}},render(){var e;const{bordered:l,mergedIconPlacement:s,cssVars:n,closable:f,showIcon:v,title:h,content:b,action:r,negativeText:p,positiveText:a,positiveButtonProps:g,negativeButtonProps:m,handlePositiveClick:y,handleNegativeClick:w,mergedTheme:P,loading:L,type:B,mergedClsPrefix:t}=this;(e=this.onRender)===null||e===void 0||e.call(this);const o=v?d(Wo,{clsPrefix:t,class:`${t}-dialog__icon`},{default:()=>W(this.$slots.icon,R=>R||(this.icon?Y(this.icon):Lt[this.type]()))}):null,_=W(this.$slots.action,R=>R||a||p||r?d("div",{class:[`${t}-dialog__action`,this.actionClass],style:this.actionStyle},R||(r?[Y(r)]:[this.negativeText&&d(D,Object.assign({theme:P.peers.Button,themeOverrides:P.peerOverrides.Button,ghost:!0,size:"small",onClick:w},m),{default:()=>Y(this.negativeText)}),this.positiveText&&d(D,Object.assign({theme:P.peers.Button,themeOverrides:P.peerOverrides.Button,size:"small",type:B==="default"?"primary":B,disabled:L,loading:L,onClick:y},g),{default:()=>Y(this.positiveText)})])):null);return d("div",{class:[`${t}-dialog`,this.themeClass,this.closable&&`${t}-dialog--closable`,`${t}-dialog--icon-${s}`,l&&`${t}-dialog--bordered`,this.rtlEnabled&&`${t}-dialog--rtl`],style:n,role:"dialog"},f?W(this.$slots.close,R=>{const i=[`${t}-dialog__close`,this.rtlEnabled&&`${t}-dialog--rtl`];return R?d("div",{class:i},R):d(ho,{focusable:this.closeFocusable,clsPrefix:t,class:i,onClick:this.handleCloseClick})}):null,v&&s==="top"?d("div",{class:`${t}-dialog-icon-container`},o):null,d("div",{class:[`${t}-dialog__title`,this.titleClass],style:this.titleStyle},v&&s==="left"?o:null,Ke(this.$slots.header,()=>[Y(h)])),d("div",{class:[`${t}-dialog__content`,_?"":`${t}-dialog__content--last`,this.contentClass],style:this.contentStyle},Ke(this.$slots.default,()=>[Y(b)])),_)}});function Ft(e){const{modalColor:l,textColor2:s,boxShadow3:n}=e;return{color:l,textColor:s,boxShadow:n}}const Ot=go({name:"Modal",common:Oe,peers:{Scrollbar:Ko,Dialog:yo,Card:Co},self:Ft}),Le="n-draggable";function jt(e,l){let s;const n=O(()=>e.value!==!1),f=O(()=>n.value?Le:""),v=O(()=>{const r=e.value;return r===!0||r===!1?!0:r?r.bounds!=="none":!0});function h(r){const p=r.querySelector(`.${Le}`);if(!p||!f.value)return;let a=0,g=0,m=0,y=0,w=0,P=0,L,B=null,t=null;function o(u){u.preventDefault(),L=u;const{x:c,y:$,right:E,bottom:N}=r.getBoundingClientRect();g=c,y=$,a=window.innerWidth-E,m=window.innerHeight-N;const{left:V,top:U}=r.style;w=+U.slice(0,-2),P=+V.slice(0,-2)}function _(){t&&(r.style.top=`${t.y}px`,r.style.left=`${t.x}px`,t=null),B=null}function R(u){if(!L)return;const{clientX:c,clientY:$}=L;let E=u.clientX-c,N=u.clientY-$;v.value&&(E>a?E=a:-E>g&&(E=-g),N>m?N=m:-N>y&&(N=-y));const V=E+P,U=N+w;t={x:V,y:U},B||(B=requestAnimationFrame(_))}function i(){L=void 0,B&&(cancelAnimationFrame(B),B=null),t&&(r.style.top=`${t.y}px`,r.style.left=`${t.x}px`,t=null),l.onEnd(r)}Q("mousedown",p,o),Q("mousemove",window,R),Q("mouseup",window,i),s=()=>{B&&cancelAnimationFrame(B),J("mousedown",p,o),J("mousemove",window,R),J("mouseup",window,i)}}function b(){s&&(s(),s=void 0)}return ko(b),{stopDrag:b,startDrag:h,draggableRef:n,draggableClassRef:f}}const Ne=Object.assign(Object.assign({},Ee),Ie),Tt=Fe(Ne),_t=le({name:"ModalBody",inheritAttrs:!1,slots:Object,props:Object.assign(Object.assign({show:{type:Boolean,required:!0},preset:String,displayDirective:{type:String,required:!0},trapFocus:{type:Boolean,default:!0},autoFocus:{type:Boolean,default:!0},blockScroll:Boolean,draggable:{type:[Boolean,Object],default:!1},maskHidden:Boolean},Ne),{renderMask:Function,onClickoutside:Function,onBeforeLeave:{type:Function,required:!0},onAfterLeave:{type:Function,required:!0},onPositiveClick:{type:Function,required:!0},onNegativeClick:{type:Function,required:!0},onClose:{type:Function,required:!0},onAfterEnter:Function,onEsc:Function}),setup(e){const l=T(null),s=T(null),n=T(e.show),f=T(null),v=T(null),h=Be(bo);let b=null;ie(re(e,"show"),c=>{c&&(b=h.getMousePosition())},{immediate:!0});const{stopDrag:r,startDrag:p,draggableRef:a,draggableClassRef:g}=jt(re(e,"draggable"),{onEnd:c=>{P(c)}}),m=O(()=>De([e.titleClass,g.value])),y=O(()=>De([e.headerClass,g.value]));ie(re(e,"show"),c=>{c&&(n.value=!0)}),mt(O(()=>e.blockScroll&&n.value));function w(){if(h.transformOriginRef.value==="center")return"";const{value:c}=f,{value:$}=v;if(c===null||$===null)return"";if(s.value){const E=s.value.containerScrollTop;return`${c}px ${$+E}px`}return""}function P(c){if(h.transformOriginRef.value==="center"||!b||!s.value)return;const $=s.value.containerScrollTop,{offsetLeft:E,offsetTop:N}=c,V=b.y,U=b.x;f.value=-(E-U),v.value=-(N-V-$),c.style.transformOrigin=w()}function L(c){He(()=>{P(c)})}function B(c){c.style.transformOrigin=w(),e.onBeforeLeave()}function t(c){const $=c;a.value&&p($),e.onAfterEnter&&e.onAfterEnter($)}function o(){n.value=!1,f.value=null,v.value=null,r(),e.onAfterLeave()}function _(){const{onClose:c}=e;c&&c()}function R(){e.onNegativeClick()}function i(){e.onPositiveClick()}const u=T(null);return ie(u,c=>{c&&He(()=>{const $=c.el;$&&l.value!==$&&(l.value=$)})}),ue(et,l),ue(ot,null),ue(tt,null),{mergedTheme:h.mergedThemeRef,appear:h.appearRef,isMounted:h.isMountedRef,mergedClsPrefix:h.mergedClsPrefixRef,bodyRef:l,scrollbarRef:s,draggableClass:g,displayed:n,childNodeRef:u,cardHeaderClass:y,dialogTitleClass:m,handlePositiveClick:i,handleNegativeClick:R,handleCloseClick:_,handleAfterEnter:t,handleAfterLeave:o,handleBeforeLeave:B,handleEnter:L}},render(){const{$slots:e,$attrs:l,handleEnter:s,handleAfterEnter:n,handleAfterLeave:f,handleBeforeLeave:v,preset:h,mergedClsPrefix:b}=this;let r=null;if(!h){if(r=Qo("default",e.default,{draggableClass:this.draggableClass}),!r){Xo("modal","default slot is empty");return}r=So(r),r.props=zo({class:`${b}-modal`},l,r.props||{})}return this.displayDirective==="show"||this.displayed||this.show?Pe(d("div",{role:"none",class:[`${b}-modal-body-wrapper`,this.maskHidden&&`${b}-modal-body-wrapper--mask-hidden`]},d(uo,{ref:"scrollbarRef",theme:this.mergedTheme.peers.Scrollbar,themeOverrides:this.mergedTheme.peerOverrides.Scrollbar,contentClass:`${b}-modal-scroll-content`},{default:()=>{var p;return[(p=this.renderMask)===null||p===void 0?void 0:p.call(this),d(Jo,{disabled:!this.trapFocus||this.maskHidden,active:this.show,onEsc:this.onEsc,autoFocus:this.autoFocus},{default:()=>{var a;return d(so,{name:"fade-in-scale-up-transition",appear:(a=this.appear)!==null&&a!==void 0?a:this.isMounted,onEnter:s,onAfterEnter:n,onAfterLeave:f,onBeforeLeave:v},{default:()=>{const g=[[Ae,this.show]],{onClickoutside:m}=this;return m&&g.push([Go,this.onClickoutside,void 0,{capture:!0}]),Pe(this.preset==="confirm"||this.preset==="dialog"?d(Mt,Object.assign({},this.$attrs,{class:[`${b}-modal`,this.$attrs.class],ref:"bodyRef",theme:this.mergedTheme.peers.Dialog,themeOverrides:this.mergedTheme.peerOverrides.Dialog},$e(this.$props,Bt),{titleClass:this.dialogTitleClass,"aria-modal":"true"}),e):this.preset==="card"?d(St,Object.assign({},this.$attrs,{ref:"bodyRef",class:[`${b}-modal`,this.$attrs.class],theme:this.mergedTheme.peers.Card,themeOverrides:this.mergedTheme.peerOverrides.Card},$e(this.$props,wt),{headerClass:this.cardHeaderClass,"aria-modal":"true",role:"dialog"}),e):this.childNodeRef=r,g)}})}})]}})),[[Ae,this.displayDirective==="if"||this.displayed||this.show]]):null}}),Et=x([S("modal-container",`
 position: fixed;
 left: 0;
 top: 0;
 height: 0;
 width: 0;
 display: flex;
 `),S("modal-mask",`
 position: fixed;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 background-color: rgba(0, 0, 0, .4);
 `,[qo({enterDuration:".25s",leaveDuration:".25s",enterCubicBezier:"var(--n-bezier-ease-out)",leaveCubicBezier:"var(--n-bezier-ease-out)"})]),S("modal-body-wrapper",`
 position: fixed;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 overflow: visible;
 `,[S("modal-scroll-content",`
 min-height: 100%;
 display: flex;
 position: relative;
 `),F("mask-hidden","pointer-events: none;",[S("modal-scroll-content",[x("> *",`
 pointer-events: all;
 `)])])]),S("modal",`
 position: relative;
 align-self: center;
 color: var(--n-text-color);
 margin: auto;
 box-shadow: var(--n-box-shadow);
 `,[nt({duration:".25s",enterScale:".5"}),x(`.${Le}`,`
 cursor: move;
 user-select: none;
 `)])]),It=Object.assign(Object.assign(Object.assign(Object.assign({},G.props),{show:Boolean,showMask:{type:Boolean,default:!0},maskClosable:{type:Boolean,default:!0},preset:String,to:[String,Object],displayDirective:{type:String,default:"if"},transformOrigin:{type:String,default:"mouse"},zIndex:Number,autoFocus:{type:Boolean,default:!0},trapFocus:{type:Boolean,default:!0},closeOnEsc:{type:Boolean,default:!0},blockScroll:{type:Boolean,default:!0}}),Ne),{draggable:[Boolean,Object],onEsc:Function,"onUpdate:show":[Function,Array],onUpdateShow:[Function,Array],onAfterEnter:Function,onBeforeLeave:Function,onAfterLeave:Function,onClose:Function,onPositiveClick:Function,onNegativeClick:Function,onMaskClick:Function,internalDialog:Boolean,internalModal:Boolean,internalAppear:{type:Boolean,default:void 0},overlayStyle:[String,Object],onBeforeHide:Function,onAfterHide:Function,onHide:Function,unstableShowMask:{type:Boolean,default:void 0}}),Nt=le({name:"Modal",inheritAttrs:!1,props:It,slots:Object,setup(e){const l=T(null),{mergedClsPrefixRef:s,namespaceRef:n,inlineThemeDisabled:f}=je(e),v=G("Modal","-modal",Et,Ot,e,s),h=vt(64),b=ut(),r=Yo(),p=e.internalDialog?Be(zt,null):null,a=e.internalModal?Be(lt,null):null,g=gt();function m(i){const{onUpdateShow:u,"onUpdate:show":c,onHide:$}=e;u&&te(u,i),c&&te(c,i),$&&!i&&$(i)}function y(){const{onClose:i}=e;i?Promise.resolve(i()).then(u=>{u!==!1&&m(!1)}):m(!1)}function w(){const{onPositiveClick:i}=e;i?Promise.resolve(i()).then(u=>{u!==!1&&m(!1)}):m(!1)}function P(){const{onNegativeClick:i}=e;i?Promise.resolve(i()).then(u=>{u!==!1&&m(!1)}):m(!1)}function L(){const{onBeforeLeave:i,onBeforeHide:u}=e;i&&te(i),u&&u()}function B(){const{onAfterLeave:i,onAfterHide:u}=e;i&&te(i),u&&u()}function t(i){var u;const{onMaskClick:c}=e;c&&c(i),e.maskClosable&&!((u=l.value)===null||u===void 0)&&u.contains(Zo(i))&&m(!1)}function o(i){var u;(u=e.onEsc)===null||u===void 0||u.call(e),e.show&&e.closeOnEsc&&st(i)&&(g.value||m(!1))}ue(bo,{getMousePosition:()=>{const i=p||a;if(i){const{clickedRef:u,clickedPositionRef:c}=i;if(u.value&&c.value)return c.value}return h.value?b.value:null},mergedClsPrefixRef:s,mergedThemeRef:v,isMountedRef:r,appearRef:re(e,"internalAppear"),transformOriginRef:re(e,"transformOrigin")});const _=O(()=>{const{common:{cubicBezierEaseOut:i},self:{boxShadow:u,color:c,textColor:$}}=v.value;return{"--n-bezier-ease-out":i,"--n-box-shadow":u,"--n-color":c,"--n-text-color":$}}),R=f?Te("theme-class",void 0,_,e):void 0;return{mergedClsPrefix:s,namespace:n,isMounted:r,containerRef:l,presetProps:O(()=>$e(e,Tt)),handleEsc:o,handleAfterLeave:B,handleClickoutside:t,handleBeforeLeave:L,doUpdateShow:m,handleNegativeClick:P,handlePositiveClick:w,handleCloseClick:y,cssVars:f?void 0:_,themeClass:R==null?void 0:R.themeClass,onRender:R==null?void 0:R.onRender}},render(){const{mergedClsPrefix:e}=this;return d(rt,{to:this.to,show:this.show},{default:()=>{var l;(l=this.onRender)===null||l===void 0||l.call(this);const{showMask:s}=this;return Pe(d("div",{role:"none",ref:"containerRef",class:[`${e}-modal-container`,this.themeClass,this.namespace],style:this.cssVars},d(_t,Object.assign({style:this.overlayStyle},this.$attrs,{ref:"bodyWrapper",displayDirective:this.displayDirective,show:this.show,preset:this.preset,autoFocus:this.autoFocus,trapFocus:this.trapFocus,draggable:this.draggable,blockScroll:this.blockScroll,maskHidden:!s},this.presetProps,{onEsc:this.handleEsc,onClose:this.handleCloseClick,onNegativeClick:this.handleNegativeClick,onPositiveClick:this.handlePositiveClick,onBeforeLeave:this.handleBeforeLeave,onAfterEnter:this.onAfterEnter,onAfterLeave:this.handleAfterLeave,onClickoutside:s?void 0:this.handleClickoutside,renderMask:s?()=>{var n;return d(so,{name:"fade-in-transition",key:"mask",appear:(n=this.internalAppear)!==null&&n!==void 0?n:this.isMounted},{default:()=>this.show?d("div",{"aria-hidden":!0,ref:"containerRef",class:`${e}-modal-mask`,onClick:this.handleClickoutside}):null})}:void 0}),this.$slots)),[[it,{zIndex:this.zIndex,enabled:this.show}]])}})}}),At={class:"join-review-detail-page"},Ht={key:0,class:"error",role:"alert"},Dt={key:1,class:"error",role:"alert"},Vt={key:2,class:"panel loading","aria-label":"正在读取申请详情"},Ut={class:"panel summary"},Wt={class:"panel"},Kt={class:"panel task-section"},Xt={class:"section-title"},qt={key:0,class:"tasks"},Yt={class:"task-index"},Zt={class:"task-actions"},Qt={class:"save-row"},Jt={key:0,class:"panel decision"},Gt={class:"decision-actions"},en={key:4,class:"error",role:"alert"},on={class:"modal-actions"},tn=le({__name:"JoinReviewDetailView",setup(e){const l=Ro(),s=jo(),n=O(()=>Number(l.query.id||0)),f=T([]),v=T(!1),h=T(""),b=To({queryKey:O(()=>["join-review",n.value]),queryFn:()=>We.get("/joinReview/get",{id:n.value}),enabled:O(()=>n.value>0)}),r=O(()=>b.data.value);ie(r,t=>{f.value=Array.isArray(t==null?void 0:t.tasks)?t.tasks.map(o=>({...o})):[]},{immediate:!0});const p=_o({mutationFn:({path:t,body:o})=>We.post(t,o),onSuccess:async()=>{await s.invalidateQueries({queryKey:["join-reviews"]}),await b.refetch()}});function a(t,o={}){n.value&&p.mutate({path:t,body:{id:n.value,...o}})}function g(){h.value="",v.value=!0}function m(){const t=h.value.trim();t&&(a("/joinReview/reject",{memo:t}),v.value=!1)}function y(){f.value.push({title:"",description:"",is_passed:0,sort:f.value.length})}function w(){a("/joinReview/saveTasks",{tasks:f.value.map((t,o)=>({id:t.id,title:t.title,description:t.description||null,is_passed:t.is_passed?1:0,sort:o}))})}function P(t,o){t.id?a("/joinReview/setTaskPassed",{task_id:t.id,is_passed:o?1:0}):t.is_passed=o?1:0}function L(t){if(t==null)return"—";if(typeof t=="object"){const o=t;return String(o.value_string??o.value_text??o.value_int??o.value_decimal??o.value_datetime??JSON.stringify(o.value_json??o))}return String(t)}function B(t){return t==="已加入"?"success":t==="已拒绝"||t==="已取消"?"error":t==="审核中"?"warning":"info"}return(t,o)=>(I(),se(C(Oo),{"theme-overrides":C(Fo),locale:C(ct)},{default:j(()=>{var _,R;return[k("div",At,[M(Eo,{title:"审核加入申请",description:n.value?`申请 #${n.value}`:"缺少申请编号","back-to":"/join-review","back-label":"返回申请列表"},Po({_:2},[r.value?{name:"actions",fn:j(()=>[M(C(at),{type:B(r.value.status),size:"large",bordered:!1},{default:j(()=>[H(K(r.value.status),1)]),_:1},8,["type"])]),key:"0"}:void 0]),1032,["description"]),n.value?C(b).isError.value?(I(),A("p",Dt,K(C(Ve)(C(b).error.value)),1)):C(b).isPending.value?(I(),A("div",Vt,[M(C(dt),{text:"",repeat:6})])):r.value?(I(),A(ae,{key:3},[k("section",Ut,[k("div",null,[o[5]||(o[5]=k("small",null,"申请人",-1)),k("h3",null,K(((_=r.value.user)==null?void 0:_.name)||`用户 #${r.value.user_id}`),1),k("p",null,K(r.value.memo||"没有补充说明"),1)])]),k("section",Wt,[o[6]||(o[6]=k("h3",null,"申请资料",-1)),k("dl",null,[(I(!0),A(ae,null,Ue(r.value.values??[],i=>{var u;return I(),A(ae,{key:String(i.id)},[k("dt",null,K(((u=i.field)==null?void 0:u.name)||`字段 #${i.field_id}`),1),k("dd",null,K(L(i)),1)],64)}),128))]),(R=r.value.values)!=null&&R.length?ee("",!0):(I(),se(C(Xe),{key:0,description:"没有申请字段值",size:"small"}))]),k("section",Kt,[k("div",Xt,[o[8]||(o[8]=k("div",null,[k("h3",null,"审核任务"),k("p",null,"记录加入前需要完成的事项。")],-1)),M(C(D),{secondary:"",onClick:y},{icon:j(()=>[M(C(No),{size:16})]),default:j(()=>[o[7]||(o[7]=H("添加任务",-1))]),_:1})]),f.value.length?(I(),A("div",qt,[(I(!0),A(ae,null,Ue(f.value,(i,u)=>(I(),A("article",{key:i.id??u},[k("span",Yt,"任务 "+K(String(u+1).padStart(2,"0")),1),k("label",null,[o[9]||(o[9]=k("span",null,"任务标题",-1)),M(C(Re),{value:i.title,"onUpdate:value":c=>i.title=c,placeholder:"例如：确认保密协议"},null,8,["value","onUpdate:value"])]),k("label",null,[o[10]||(o[10]=k("span",null,"任务说明",-1)),M(C(Re),{value:i.description,"onUpdate:value":c=>i.description=c,type:"textarea",autosize:{minRows:3,maxRows:6},placeholder:"补充验收标准或负责人"},null,8,["value","onUpdate:value"])]),k("div",Zt,[M(C(Ao),{checked:i.is_passed===1,"onUpdate:checked":c=>P(i,c)},{default:j(()=>[...o[11]||(o[11]=[H("已完成",-1)])]),_:1},8,["checked","onUpdate:checked"]),M(C(D),{quaternary:"",type:"error",onClick:c=>f.value.splice(u,1)},{icon:j(()=>[M(C(Bo),{size:17})]),default:j(()=>[o[12]||(o[12]=H("移除",-1))]),_:1},8,["onClick"])])]))),128)),k("div",Qt,[M(C(D),{type:"primary",loading:C(p).isPending.value,onClick:w},{default:j(()=>[...o[13]||(o[13]=[H("保存任务",-1)])]),_:1},8,["loading"])])])):(I(),se(C(Xe),{key:1,description:"暂无审核任务，按需添加",size:"small"}))]),["已申请","审核中"].includes(String(r.value.status))?(I(),A("section",Jt,[o[17]||(o[17]=k("div",null,[k("h3",null,"审核决定"),k("p",null,"确认资料与任务后处理本次申请。")],-1)),k("div",Gt,[r.value.status==="已申请"?(I(),se(C(D),{key:0,secondary:"",loading:C(p).isPending.value,onClick:o[0]||(o[0]=i=>a("/joinReview/review"))},{default:j(()=>[...o[14]||(o[14]=[H("进入审核",-1)])]),_:1},8,["loading"])):ee("",!0),M(C(D),{type:"primary",loading:C(p).isPending.value,onClick:o[1]||(o[1]=i=>a("/joinReview/approve"))},{icon:j(()=>[M(C(Ho),{size:17})]),default:j(()=>[o[15]||(o[15]=H("同意加入",-1))]),_:1},8,["loading"]),M(C(D),{type:"error",secondary:"",loading:C(p).isPending.value,onClick:g},{default:j(()=>[...o[16]||(o[16]=[H("拒绝申请",-1)])]),_:1},8,["loading"])])])):ee("",!0)],64)):ee("",!0):(I(),A("p",Ht,"缺少有效的申请编号，请返回列表重新选择。")),C(p).isError.value?(I(),A("p",en,K(C(Ve)(C(p).error.value)),1)):ee("",!0),M(C(Nt),{show:v.value,"onUpdate:show":o[4]||(o[4]=i=>v.value=i),preset:"card",title:"拒绝加入申请",style:{width:"min(92vw, 30rem)"}},{footer:j(()=>[k("div",on,[M(C(D),{onClick:o[3]||(o[3]=i=>v.value=!1)},{default:j(()=>[...o[18]||(o[18]=[H("取消",-1)])]),_:1}),M(C(D),{type:"error",disabled:!h.value.trim(),onClick:m},{default:j(()=>[...o[19]||(o[19]=[H("确认拒绝",-1)])]),_:1},8,["disabled"])])]),default:j(()=>[o[20]||(o[20]=k("p",{class:"modal-copy"},"请填写拒绝原因。该内容会用于审核记录，并帮助申请人理解结果。",-1)),M(C(Re),{value:h.value,"onUpdate:value":o[2]||(o[2]=i=>h.value=i),"aria-label":"拒绝原因",type:"textarea",autosize:{minRows:3,maxRows:6},maxlength:"300","show-count":"",placeholder:"请输入具体、可理解的拒绝原因",onKeydown:$o(Lo(m,["ctrl"]),["enter"])},null,8,["value","onKeydown"])]),_:1},8,["show"])])]}),_:1},8,["theme-overrides","locale"]))}}),xn=Mo(tn,[["__scopeId","data-v-40d3d1c2"]]);export{xn as default};
