import{bU as X,L as F,ak as x,al as y,Q as k,T as f,V as H,bZ as Y,O as A,d as W,k as a,b_ as ee,W as V,a2 as _,av as oe,a4 as re,i as E,n as ne,aB as D,bJ as te,aQ as se,aF as le,bM as ie,bN as ae,bP as ce,bO as de,$ as ue,bK as ge,a8 as v,aR as he,F as K,aM as L,a as M,r as fe,e as j,u as O,w as ve,j as be,t as me,o as B,m as Ce}from"./index-Dt3fUKCm.js";let N=!1;function pe(){if(X&&window.CSS&&!N&&(N=!0,"registerProperty"in(window==null?void 0:window.CSS)))try{CSS.registerProperty({name:"--n-color-start",syntax:"<color>",inherits:!1,initialValue:"#0000"}),CSS.registerProperty({name:"--n-color-end",syntax:"<color>",inherits:!1,initialValue:"#0000"})}catch{}}const xe={iconMargin:"11px 8px 0 12px",iconMarginRtl:"11px 12px 0 8px",iconSize:"24px",closeIconSize:"16px",closeSize:"20px",closeMargin:"13px 14px 0 0",closeMarginRtl:"13px 0 0 14px",padding:"13px"};function ye(e){const{lineHeight:o,borderRadius:t,fontWeightStrong:c,baseColor:n,dividerColor:l,actionColor:u,textColor1:g,textColor2:i,closeColorHover:h,closeColorPressed:m,closeIconColor:C,closeIconColorHover:p,closeIconColorPressed:s,infoColor:r,successColor:S,warningColor:z,errorColor:d,fontSize:I}=e;return Object.assign(Object.assign({},xe),{fontSize:I,lineHeight:o,titleFontWeight:c,borderRadius:t,border:`1px solid ${l}`,color:u,titleTextColor:g,iconColor:i,contentTextColor:i,closeBorderRadius:t,closeColorHover:h,closeColorPressed:m,closeIconColor:C,closeIconColorHover:p,closeIconColorPressed:s,borderInfo:`1px solid ${x(n,y(r,{alpha:.25}))}`,colorInfo:x(n,y(r,{alpha:.08})),titleTextColorInfo:g,iconColorInfo:r,contentTextColorInfo:i,closeColorHoverInfo:h,closeColorPressedInfo:m,closeIconColorInfo:C,closeIconColorHoverInfo:p,closeIconColorPressedInfo:s,borderSuccess:`1px solid ${x(n,y(S,{alpha:.25}))}`,colorSuccess:x(n,y(S,{alpha:.08})),titleTextColorSuccess:g,iconColorSuccess:S,contentTextColorSuccess:i,closeColorHoverSuccess:h,closeColorPressedSuccess:m,closeIconColorSuccess:C,closeIconColorHoverSuccess:p,closeIconColorPressedSuccess:s,borderWarning:`1px solid ${x(n,y(z,{alpha:.33}))}`,colorWarning:x(n,y(z,{alpha:.08})),titleTextColorWarning:g,iconColorWarning:z,contentTextColorWarning:i,closeColorHoverWarning:h,closeColorPressedWarning:m,closeIconColorWarning:C,closeIconColorHoverWarning:p,closeIconColorPressedWarning:s,borderError:`1px solid ${x(n,y(d,{alpha:.25}))}`,colorError:x(n,y(d,{alpha:.08})),titleTextColorError:g,iconColorError:d,contentTextColorError:i,closeColorHoverError:h,closeColorPressedError:m,closeIconColorError:C,closeIconColorHoverError:p,closeIconColorPressedError:s})}const Se={common:F,self:ye},ze=k("alert",`
 line-height: var(--n-line-height);
 border-radius: var(--n-border-radius);
 position: relative;
 transition: background-color .3s var(--n-bezier);
 background-color: var(--n-color);
 text-align: start;
 word-break: break-word;
`,[f("border",`
 border-radius: inherit;
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 transition: border-color .3s var(--n-bezier);
 border: var(--n-border);
 pointer-events: none;
 `),H("closable",[k("alert-body",[f("title",`
 padding-right: 24px;
 `)])]),f("icon",{color:"var(--n-icon-color)"}),k("alert-body",{padding:"var(--n-padding)"},[f("title",{color:"var(--n-title-text-color)"}),f("content",{color:"var(--n-content-text-color)"})]),Y({originalTransition:"transform .3s var(--n-bezier)",enterToProps:{transform:"scale(1)"},leaveToProps:{transform:"scale(0.9)"}}),f("icon",`
 position: absolute;
 left: 0;
 top: 0;
 align-items: center;
 justify-content: center;
 display: flex;
 width: var(--n-icon-size);
 height: var(--n-icon-size);
 font-size: var(--n-icon-size);
 margin: var(--n-icon-margin);
 `),f("close",`
 transition:
 color .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 position: absolute;
 right: 0;
 top: 0;
 margin: var(--n-close-margin);
 `),H("show-icon",[k("alert-body",{paddingLeft:"calc(var(--n-icon-margin-left) + var(--n-icon-size) + var(--n-icon-margin-right))"})]),H("right-adjust",[k("alert-body",{paddingRight:"calc(var(--n-close-size) + var(--n-padding) + 2px)"})]),k("alert-body",`
 border-radius: var(--n-border-radius);
 transition: border-color .3s var(--n-bezier);
 `,[f("title",`
 transition: color .3s var(--n-bezier);
 font-size: 16px;
 line-height: 19px;
 font-weight: var(--n-title-font-weight);
 `,[A("& +",[f("content",{marginTop:"9px"})])]),f("content",{transition:"color .3s var(--n-bezier)",fontSize:"var(--n-font-size)"})]),f("icon",{transition:"color .3s var(--n-bezier)"})]),Ie=Object.assign(Object.assign({},_.props),{title:String,showIcon:{type:Boolean,default:!0},type:{type:String,default:"default"},bordered:{type:Boolean,default:!0},closable:Boolean,onClose:Function,onAfterLeave:Function,onAfterHide:Function}),ke=W({name:"Alert",inheritAttrs:!1,props:Ie,slots:Object,setup(e){const{mergedClsPrefixRef:o,mergedBorderedRef:t,inlineThemeDisabled:c,mergedRtlRef:n}=V(e),l=_("Alert","-alert",ze,Se,e,o),u=oe("Alert",n,o),g=E(()=>{const{common:{cubicBezierEaseInOut:s},self:r}=l.value,{fontSize:S,borderRadius:z,titleFontWeight:d,lineHeight:I,iconSize:R,iconMargin:T,iconMarginRtl:$,closeIconSize:P,closeBorderRadius:w,closeSize:Q,closeMargin:J,closeMarginRtl:U,padding:Z}=r,{type:b}=e,{left:q,right:G}=ge(T);return{"--n-bezier":s,"--n-color":r[v("color",b)],"--n-close-icon-size":P,"--n-close-border-radius":w,"--n-close-color-hover":r[v("closeColorHover",b)],"--n-close-color-pressed":r[v("closeColorPressed",b)],"--n-close-icon-color":r[v("closeIconColor",b)],"--n-close-icon-color-hover":r[v("closeIconColorHover",b)],"--n-close-icon-color-pressed":r[v("closeIconColorPressed",b)],"--n-icon-color":r[v("iconColor",b)],"--n-border":r[v("border",b)],"--n-title-text-color":r[v("titleTextColor",b)],"--n-content-text-color":r[v("contentTextColor",b)],"--n-line-height":I,"--n-border-radius":z,"--n-font-size":S,"--n-title-font-weight":d,"--n-icon-size":R,"--n-icon-margin":T,"--n-icon-margin-rtl":$,"--n-close-size":Q,"--n-close-margin":J,"--n-close-margin-rtl":U,"--n-padding":Z,"--n-icon-margin-left":q,"--n-icon-margin-right":G}}),i=c?re("alert",E(()=>e.type[0]),g,e):void 0,h=ne(!0),m=()=>{const{onAfterLeave:s,onAfterHide:r}=e;s&&s(),r&&r()};return{rtlEnabled:u,mergedClsPrefix:o,mergedBordered:t,visible:h,handleCloseClick:()=>{var s;Promise.resolve((s=e.onClose)===null||s===void 0?void 0:s.call(e)).then(r=>{r!==!1&&(h.value=!1)})},handleAfterLeave:()=>{m()},mergedTheme:l,cssVars:c?void 0:g,themeClass:i==null?void 0:i.themeClass,onRender:i==null?void 0:i.onRender}},render(){var e;return(e=this.onRender)===null||e===void 0||e.call(this),a(ee,{onAfterLeave:this.handleAfterLeave},{default:()=>{const{mergedClsPrefix:o,$slots:t}=this,c={class:[`${o}-alert`,this.themeClass,this.closable&&`${o}-alert--closable`,this.showIcon&&`${o}-alert--show-icon`,!this.title&&this.closable&&`${o}-alert--right-adjust`,this.rtlEnabled&&`${o}-alert--rtl`],style:this.cssVars,role:"alert"};return this.visible?a("div",Object.assign({},D(this.$attrs,c)),this.closable&&a(te,{clsPrefix:o,class:`${o}-alert__close`,onClick:this.handleCloseClick}),this.bordered&&a("div",{class:`${o}-alert__border`}),this.showIcon&&a("div",{class:`${o}-alert__icon`,"aria-hidden":"true"},se(t.icon,()=>[a(le,{clsPrefix:o},{default:()=>{switch(this.type){case"success":return a(de,null);case"info":return a(ce,null);case"warning":return a(ae,null);case"error":return a(ie,null);default:return null}}})])),a("div",{class:[`${o}-alert-body`,this.mergedBordered&&`${o}-alert-body--bordered`]},ue(t.header,n=>{const l=n||this.title;return l?a("div",{class:`${o}-alert-body__title`},l):null}),t.default&&a("div",{class:`${o}-alert-body__content`},t))):null}})}});function Pe(e){const{heightSmall:o,heightMedium:t,heightLarge:c,borderRadius:n}=e;return{color:"#eee",colorEnd:"#ddd",borderRadius:n,heightSmall:o,heightMedium:t,heightLarge:c}}const we={common:F,self:Pe},Re=A([k("skeleton",`
 height: 1em;
 width: 100%;
 transition:
 --n-color-start .3s var(--n-bezier),
 --n-color-end .3s var(--n-bezier),
 background-color .3s var(--n-bezier);
 animation: 2s skeleton-loading infinite cubic-bezier(0.36, 0, 0.64, 1);
 background-color: var(--n-color-start);
 `),A("@keyframes skeleton-loading",`
 0% {
 background: var(--n-color-start);
 }
 40% {
 background: var(--n-color-end);
 }
 80% {
 background: var(--n-color-start);
 }
 100% {
 background: var(--n-color-start);
 }
 `)]),Te=Object.assign(Object.assign({},_.props),{text:Boolean,round:Boolean,circle:Boolean,height:[String,Number],width:[String,Number],size:String,repeat:{type:Number,default:1},animated:{type:Boolean,default:!0},sharp:{type:Boolean,default:!0}}),$e=W({name:"Skeleton",inheritAttrs:!1,props:Te,setup(e){pe();const{mergedClsPrefixRef:o,mergedComponentPropsRef:t}=V(e),c=E(()=>{var l,u;return e.size||((u=(l=t==null?void 0:t.value)===null||l===void 0?void 0:l.Skeleton)===null||u===void 0?void 0:u.size)}),n=_("Skeleton","-skeleton",Re,we,e,o);return{mergedClsPrefix:o,style:E(()=>{var l,u;const g=n.value,{common:{cubicBezierEaseInOut:i}}=g,h=g.self,{color:m,colorEnd:C,borderRadius:p}=h;let s;const{circle:r,sharp:S,round:z,width:d,height:I,text:R,animated:T}=e,$=c.value;$!==void 0&&(s=h[v("height",$)]);const P=r?(l=d??I)!==null&&l!==void 0?l:s:d,w=(u=r?d??I:I)!==null&&u!==void 0?u:s;return{display:R?"inline-block":"",verticalAlign:R?"-0.125em":"",borderRadius:r?"50%":z?"4096px":S?"":p,width:typeof P=="number"?L(P):P,height:typeof w=="number"?L(w):w,animation:T?"":"none","--n-bezier":i,"--n-color-start":m,"--n-color-end":C}})}},render(){const{repeat:e,style:o,mergedClsPrefix:t,$attrs:c}=this,n=a("div",D({class:`${t}-skeleton`,style:o},c));return e>1?a(K,null,he(e,null).map(l=>[n,`
`])):n}}),Be=["aria-busy","role"],Ee=W({__name:"LsAsyncState",props:{state:{},title:{default:""},description:{default:""},rows:{default:3}},setup(e){return(o,t)=>(B(),M("section",{class:"ls-async-state","aria-busy":e.state==="loading"||void 0,role:e.state==="error"?"alert":"status"},[e.state==="loading"?(B(!0),M(K,{key:0},fe(e.rows,c=>(B(),j(O($e),{key:c,text:"",repeat:1}))),128)):(B(),j(O(ke),{key:1,type:"error",title:e.title||"暂时无法读取"},{default:ve(()=>[be(me(e.description||"请稍后再试；页面其他功能仍可继续使用。"),1)]),_:1},8,["title"]))],8,Be))}}),He=Ce(Ee,[["__scopeId","data-v-f0c60eea"]]);export{He as L};
