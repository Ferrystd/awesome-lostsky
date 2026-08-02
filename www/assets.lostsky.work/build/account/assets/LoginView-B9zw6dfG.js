import{d as me,c as O,i as xe,u as oe,a as te,r as f,b as K,e as T,f as Ce,t as j,g as G,h as V,j as ye,k as L,l as S,m as B,n as A,o as W,p as Re,q as re,s as ke,v as Se,w as E,x as J,y as we,z as M,A as y,B as ze,C as Be,D as w,E as m,F as _,G as I,H,I as Q,J as X,K as N,L as _e,M as Y,N as Ve,O as Z,P as $e,Q as Fe,R as Ie}from"./index-DoRi4iOR.js";import{L as Te}from"./LsButton-CUl8lVIC.js";import{u as ae,L as P,a as q}from"./LsInput-D2EVaqX8.js";import{A as De,S as Ue}from"./SmsCodeField-CFzZSobn.js";import{c as ne,_ as Le}from"./_plugin-vue_export-helper-C05IM1o8.js";import"./use-locale-BAg4TxqK.js";import"./arrow-left-CdgD44ol.js";/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],He=ne("eye-off",Ae);/**
 * @license @lucide/vue v1.24.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ee=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],Me=ne("eye",Ee);function Ne(e,o="default",t=[]){const a=e.$slots[o];return a===void 0?t:a()}const Pe={radioSizeSmall:"14px",radioSizeMedium:"16px",radioSizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function qe(e){const{borderColor:o,primaryColor:t,baseColor:n,textColorDisabled:a,inputColorDisabled:v,textColor2:l,opacityDisabled:s,borderRadius:p,fontSizeSmall:u,fontSizeMedium:x,fontSizeLarge:C,heightSmall:h,heightMedium:g,heightLarge:r,lineHeight:R}=e;return Object.assign(Object.assign({},Pe),{labelLineHeight:R,buttonHeightSmall:h,buttonHeightMedium:g,buttonHeightLarge:r,fontSizeSmall:u,fontSizeMedium:x,fontSizeLarge:C,boxShadow:`inset 0 0 0 1px ${o}`,boxShadowActive:`inset 0 0 0 1px ${t}`,boxShadowFocus:`inset 0 0 0 1px ${t}, 0 0 0 2px ${O(t,{alpha:.2})}`,boxShadowHover:`inset 0 0 0 1px ${t}`,boxShadowDisabled:`inset 0 0 0 1px ${o}`,color:n,colorDisabled:v,colorActive:"#0000",textColor:l,textColorDisabled:a,dotColorActive:t,dotColorDisabled:o,buttonBorderColor:o,buttonBorderColorActive:t,buttonBorderColorHover:o,buttonColor:n,buttonColorActive:n,buttonTextColor:l,buttonTextColorActive:t,buttonTextColorHover:t,opacityDisabled:s,buttonBoxShadowFocus:`inset 0 0 0 1px ${t}, 0 0 0 2px ${O(t,{alpha:.3})}`,buttonBoxShadowHover:"inset 0 0 0 1px #0000",buttonBoxShadow:"inset 0 0 0 1px #0000",buttonBorderRadius:p})}const je={common:me,self:qe},Ge={name:String,value:{type:[String,Number,Boolean],default:"on"},checked:{type:Boolean,default:void 0},defaultChecked:Boolean,disabled:{type:Boolean,default:void 0},label:String,size:String,onUpdateChecked:[Function,Array],"onUpdate:checked":[Function,Array],checkedValue:{type:Boolean,default:void 0}},ie=Ce("n-radio-group");function Oe(e){const o=xe(ie,null),{mergedClsPrefixRef:t,mergedComponentPropsRef:n}=oe(e),a=te(e,{mergedSize(i){var d,b;const{size:k}=e;if(k!==void 0)return k;if(o){const{mergedSizeRef:{value:U}}=o;if(U!==void 0)return U}if(i)return i.mergedSize.value;const D=(b=(d=n==null?void 0:n.value)===null||d===void 0?void 0:d.Radio)===null||b===void 0?void 0:b.size;return D||"medium"},mergedDisabled(i){return!!(e.disabled||o!=null&&o.disabledRef.value||i!=null&&i.disabled.value)}}),{mergedSizeRef:v,mergedDisabledRef:l}=a,s=f(null),p=f(null),u=f(e.defaultChecked),x=j(e,"checked"),C=ae(x,u),h=K(()=>o?o.valueRef.value===e.value:C.value),g=K(()=>{const{name:i}=e;if(i!==void 0)return i;if(o)return o.nameRef.value}),r=f(!1);function R(){if(o){const{doUpdateValue:i}=o,{value:d}=e;T(i,d)}else{const{onUpdateChecked:i,"onUpdate:checked":d}=e,{nTriggerFormInput:b,nTriggerFormChange:k}=a;i&&T(i,!0),d&&T(d,!0),b(),k(),u.value=!0}}function c(){l.value||h.value||R()}function $(){c(),s.value&&(s.value.checked=h.value)}function F(){r.value=!1}function z(){r.value=!0}return{mergedClsPrefix:o?o.mergedClsPrefixRef:t,inputRef:s,labelRef:p,mergedName:g,mergedDisabled:l,renderSafeChecked:h,focus:r,mergedSize:v,handleRadioInputChange:$,handleRadioInputBlur:F,handleRadioInputFocus:z}}const ee=G({name:"RadioButton",props:Ge,setup:Oe,render(){const{mergedClsPrefix:e}=this;return V("label",{class:[`${e}-radio-button`,this.mergedDisabled&&`${e}-radio-button--disabled`,this.renderSafeChecked&&`${e}-radio-button--checked`,this.focus&&[`${e}-radio-button--focus`]]},V("input",{ref:"inputRef",type:"radio",class:`${e}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur}),V("div",{class:`${e}-radio-button__state-border`}),ye(this.$slots.default,o=>!o&&!this.label?null:V("div",{ref:"labelRef",class:`${e}-radio__label`},o||this.label)))}}),Ke=L("radio-group",`
 display: inline-block;
 font-size: var(--n-font-size);
`,[S("splitor",`
 display: inline-block;
 vertical-align: bottom;
 width: 1px;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 background: var(--n-button-border-color);
 `,[B("checked",{backgroundColor:"var(--n-button-border-color-active)"}),B("disabled",{opacity:"var(--n-opacity-disabled)"})]),B("button-group",`
 white-space: nowrap;
 height: var(--n-height);
 line-height: var(--n-height);
 `,[L("radio-button",{height:"var(--n-height)",lineHeight:"var(--n-height)"}),S("splitor",{height:"var(--n-height)"})]),L("radio-button",`
 vertical-align: bottom;
 outline: none;
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 display: inline-block;
 box-sizing: border-box;
 padding-left: 14px;
 padding-right: 14px;
 white-space: nowrap;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 border-color .3s var(--n-bezier),
 color .3s var(--n-bezier);
 background: var(--n-button-color);
 color: var(--n-button-text-color);
 border-top: 1px solid var(--n-button-border-color);
 border-bottom: 1px solid var(--n-button-border-color);
 `,[L("radio-input",`
 pointer-events: none;
 position: absolute;
 border: 0;
 border-radius: inherit;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 opacity: 0;
 z-index: 1;
 `),S("state-border",`
 z-index: 1;
 pointer-events: none;
 position: absolute;
 box-shadow: var(--n-button-box-shadow);
 transition: box-shadow .3s var(--n-bezier);
 left: -1px;
 bottom: -1px;
 right: -1px;
 top: -1px;
 `),A("&:first-child",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 border-left: 1px solid var(--n-button-border-color);
 `,[S("state-border",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 `)]),A("&:last-child",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 border-right: 1px solid var(--n-button-border-color);
 `,[S("state-border",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 `)]),W("disabled",`
 cursor: pointer;
 `,[A("&:hover",[S("state-border",`
 transition: box-shadow .3s var(--n-bezier);
 box-shadow: var(--n-button-box-shadow-hover);
 `),W("checked",{color:"var(--n-button-text-color-hover)"})]),B("focus",[A("&:not(:active)",[S("state-border",{boxShadow:"var(--n-button-box-shadow-focus)"})])])]),B("checked",`
 background: var(--n-button-color-active);
 color: var(--n-button-text-color-active);
 border-color: var(--n-button-border-color-active);
 `),B("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `)])]);function We(e,o,t){var n;const a=[];let v=!1;for(let l=0;l<e.length;++l){const s=e[l],p=(n=s.type)===null||n===void 0?void 0:n.name;p==="RadioButton"&&(v=!0);const u=s.props;if(p!=="RadioButton"){a.push(s);continue}if(l===0)a.push(s);else{const x=a[a.length-1].props,C=o===x.value,h=x.disabled,g=o===u.value,r=u.disabled,R=(C?2:0)+(h?0:1),c=(g?2:0)+(r?0:1),$={[`${t}-radio-group__splitor--disabled`]:h,[`${t}-radio-group__splitor--checked`]:C},F={[`${t}-radio-group__splitor--disabled`]:r,[`${t}-radio-group__splitor--checked`]:g},z=R<c?F:$;a.push(V("div",{class:[`${t}-radio-group__splitor`,z]}),s)}}return{children:a,isButtonGroup:v}}const Je=Object.assign(Object.assign({},re.props),{name:String,value:[String,Number,Boolean],defaultValue:{type:[String,Number,Boolean],default:null},size:String,disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),Qe=G({name:"RadioGroup",props:Je,setup(e){const o=f(null),{mergedSizeRef:t,mergedDisabledRef:n,nTriggerFormChange:a,nTriggerFormInput:v,nTriggerFormBlur:l,nTriggerFormFocus:s}=te(e),{mergedClsPrefixRef:p,inlineThemeDisabled:u,mergedRtlRef:x}=oe(e),C=re("Radio","-radio-group",Ke,je,e,p),h=f(e.defaultValue),g=j(e,"value"),r=ae(g,h);function R(d){const{onUpdateValue:b,"onUpdate:value":k}=e;b&&T(b,d),k&&T(k,d),h.value=d,a(),v()}function c(d){const{value:b}=o;b&&(b.contains(d.relatedTarget)||s())}function $(d){const{value:b}=o;b&&(b.contains(d.relatedTarget)||l())}we(ie,{mergedClsPrefixRef:p,nameRef:j(e,"name"),valueRef:r,disabledRef:n,mergedSizeRef:t,doUpdateValue:R});const F=ke("Radio",x,p),z=E(()=>{const{value:d}=t,{common:{cubicBezierEaseInOut:b},self:{buttonBorderColor:k,buttonBorderColorActive:D,buttonBorderRadius:U,buttonBoxShadow:le,buttonBoxShadowFocus:se,buttonBoxShadowHover:de,buttonColor:ue,buttonColorActive:ce,buttonTextColor:be,buttonTextColorActive:ve,buttonTextColorHover:pe,opacityDisabled:fe,[J("buttonHeight",d)]:he,[J("fontSize",d)]:ge}}=C.value;return{"--n-font-size":ge,"--n-bezier":b,"--n-button-border-color":k,"--n-button-border-color-active":D,"--n-button-border-radius":U,"--n-button-box-shadow":le,"--n-button-box-shadow-focus":se,"--n-button-box-shadow-hover":de,"--n-button-color":ue,"--n-button-color-active":ce,"--n-button-text-color":be,"--n-button-text-color-hover":pe,"--n-button-text-color-active":ve,"--n-height":he,"--n-opacity-disabled":fe}}),i=u?Se("radio-group",E(()=>t.value[0]),z,e):void 0;return{selfElRef:o,rtlEnabled:F,mergedClsPrefix:p,mergedValue:r,handleFocusout:$,handleFocusin:c,cssVars:u?void 0:z,themeClass:i==null?void 0:i.themeClass,onRender:i==null?void 0:i.onRender}},render(){var e;const{mergedValue:o,mergedClsPrefix:t,handleFocusin:n,handleFocusout:a}=this,{children:v,isButtonGroup:l}=We(Re(Ne(this)),o,t);return(e=this.onRender)===null||e===void 0||e.call(this),V("div",{onFocusin:n,onFocusout:a,ref:"selfElRef",class:[`${t}-radio-group`,this.rtlEnabled&&`${t}-radio-group--rtl`,this.themeClass,l&&`${t}-radio-group--button-group`],style:this.cssVars},v)}}),Xe={key:0,class:"notice"},Ye={key:1,class:"error",role:"alert"},Ze={class:"password"},eo={class:"switch"},oo=G({__name:"LoginView",setup(e){const o=ze(),t=f("sms"),n=f(""),a=f(""),v=f(""),l=f(""),s=f(!1),p=f(!1),u=f(""),x=E(()=>o.query.expired==="1"),C=E(()=>({path:"/register",query:o.query.redirect?{redirect:o.query.redirect}:{}}));async function h(){if(u.value="",t.value==="sms"){if(!/^1[3-9]\d{9}$/.test(n.value.trim())||!a.value.trim()){u.value="请输入正确的手机号码和短信验证码";return}}else if(!v.value.trim()||l.value.length<6){u.value="请输入账号，密码不少于 6 位";return}p.value=!0;try{const g=t.value==="sms"?await Z.post("/login/sms",{phone:n.value.trim(),code:a.value.trim()}):await Z.post("/login/password",{account:v.value.trim(),password:l.value});$e.save(g),Fe(o.query.redirect)}catch(g){u.value=Ie(g)}finally{p.value=!1}}return(g,r)=>{const R=Be("RouterLink");return w(),M(De,{title:"欢迎回来",intro:"使用短信验证码或密码继续进入你的工作空间。"},{default:y(()=>[m(_(Qe),{value:t.value,"onUpdate:value":r[0]||(r[0]=c=>t.value=c),class:"mode",name:"login-mode","aria-label":"登录方式"},{default:y(()=>[m(_(ee),{value:"sms"},{default:y(()=>[...r[6]||(r[6]=[I("验证码登录",-1)])]),_:1}),m(_(ee),{value:"password"},{default:y(()=>[...r[7]||(r[7]=[I("密码登录",-1)])]),_:1})]),_:1},8,["value"]),x.value?(w(),H("p",Xe,"登录状态已过期，请重新登录。")):Q("",!0),u.value?(w(),H("p",Ye,X(u.value),1)):Q("",!0),N("form",{class:"form",onSubmit:_e(h,["prevent"])},[t.value==="sms"?(w(),H(Y,{key:0},[m(P,{label:"手机号码","for-id":"login-phone",required:""},{default:y(()=>[m(q,{id:"login-phone",modelValue:n.value,"onUpdate:modelValue":r[1]||(r[1]=c=>n.value=c),type:"tel",inputmode:"tel",autocomplete:"tel",placeholder:"请输入手机号码"},null,8,["modelValue"])]),_:1}),m(Ue,{modelValue:a.value,"onUpdate:modelValue":r[2]||(r[2]=c=>a.value=c),phone:n.value,purpose:"login",id:"login-code"},null,8,["modelValue","phone"])],64)):(w(),H(Y,{key:1},[m(P,{label:"手机号 / 用户名 / 邮箱","for-id":"login-account",required:""},{default:y(()=>[m(q,{id:"login-account",modelValue:v.value,"onUpdate:modelValue":r[3]||(r[3]=c=>v.value=c),type:"text",autocomplete:"username",placeholder:"请输入手机号、用户名或邮箱"},null,8,["modelValue"])]),_:1}),m(P,{label:"密码","for-id":"login-password",required:""},{default:y(()=>[N("div",Ze,[m(q,{id:"login-password",modelValue:l.value,"onUpdate:modelValue":r[4]||(r[4]=c=>l.value=c),type:s.value?"text":"password",autocomplete:"current-password",placeholder:"至少 6 位"},null,8,["modelValue","type"]),m(_(Ve),{quaternary:"",circle:"","aria-label":s.value?"隐藏密码":"显示密码",onClick:r[5]||(r[5]=c=>s.value=!s.value)},{icon:y(()=>[s.value?(w(),M(_(He),{key:0,size:19})):(w(),M(_(Me),{key:1,size:19}))]),_:1},8,["aria-label"])])]),_:1})],64)),m(Te,{type:"submit",size:"lg",loading:p.value},{default:y(()=>[I(X(t.value==="sms"?"验证码登录":"密码登录"),1)]),_:1},8,["loading"])],32),N("p",eo,[r[9]||(r[9]=I("还没有账号？",-1)),m(R,{to:C.value},{default:y(()=>[...r[8]||(r[8]=[I("创建通行证",-1)])]),_:1},8,["to"])])]),_:1})}}}),uo=Le(oo,[["__scopeId","data-v-125f31d0"]]);export{uo as default};
