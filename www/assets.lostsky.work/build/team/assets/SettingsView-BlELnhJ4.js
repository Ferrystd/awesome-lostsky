import{a2 as He,H as T,a4 as ee,g as oe,X as w,d as O,a6 as Ue,w as Ie,j as P,l as ye,u as _,t as $,k as z,F as ue,x as be,i as C,q as ke,K as Te,m as he,p as Ae,a5 as Ne,y as G,v as ve,J as je,A as Se,_ as Ee}from"./index-BoZC3P6g.js";import{L as Oe}from"./LsButton-DhUvFQ_Q.js";import{u as Me}from"./useQueryClient-CR1XO1Vm.js";import{u as Le}from"./useQuery-BiOs9qjG.js";import{u as We}from"./useMutation-C440TawQ.js";import{A as Ke}from"./AdminPageHeader-D39SetWW.js";import{d as Re,E as ge,b as M,f as S,g as i,c as D,Z,u as te,F as me,G as xe,J as Ce,v as Ge,q as K,k as W,m as q,n as ze,p as we,s as H,H as _e,_ as fe,I as qe,$ as Qe,D as pe,a0 as E}from"./browser-C_JbnFiC.js";import{n as Xe}from"./Tag-BLa-B_6B.js";import{N as Ye}from"./Select-D2mOzx5J.js";import{N as Je}from"./InputNumber-uSBnqoJ1.js";import{N as Ze}from"./Input-DN__2T7X.js";import"./queryObserver-7xN9P0UL.js";import"./arrow-left-DgOEN2Ou.js";import"./Button-Bf6xUeRd.js";import"./format-length-DnVSdV3z.js";function eo(e,o="default",r=[]){const s=e.$slots[o];return s===void 0?r:s()}const oo={radioSizeSmall:"14px",radioSizeMedium:"16px",radioSizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function to(e){const{borderColor:o,primaryColor:r,baseColor:l,textColorDisabled:s,inputColorDisabled:p,textColor2:u,opacityDisabled:h,borderRadius:b,fontSizeSmall:x,fontSizeMedium:y,fontSizeLarge:d,heightSmall:a,heightMedium:t,heightLarge:m,lineHeight:n}=e;return Object.assign(Object.assign({},oo),{labelLineHeight:n,buttonHeightSmall:a,buttonHeightMedium:t,buttonHeightLarge:m,fontSizeSmall:x,fontSizeMedium:y,fontSizeLarge:d,boxShadow:`inset 0 0 0 1px ${o}`,boxShadowActive:`inset 0 0 0 1px ${r}`,boxShadowFocus:`inset 0 0 0 1px ${r}, 0 0 0 2px ${ge(r,{alpha:.2})}`,boxShadowHover:`inset 0 0 0 1px ${r}`,boxShadowDisabled:`inset 0 0 0 1px ${o}`,color:l,colorDisabled:p,colorActive:"#0000",textColor:u,textColorDisabled:s,dotColorActive:r,dotColorDisabled:o,buttonBorderColor:o,buttonBorderColorActive:r,buttonBorderColorHover:o,buttonColor:l,buttonColorActive:l,buttonTextColor:u,buttonTextColorActive:r,buttonTextColorHover:r,opacityDisabled:h,buttonBoxShadowFocus:`inset 0 0 0 1px ${r}, 0 0 0 2px ${ge(r,{alpha:.3})}`,buttonBoxShadowHover:"inset 0 0 0 1px #0000",buttonBoxShadow:"inset 0 0 0 1px #0000",buttonBorderRadius:b})}const Be={common:Re,self:to},ao=M("radio",`
 line-height: var(--n-label-line-height);
 outline: none;
 position: relative;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 align-items: flex-start;
 flex-wrap: nowrap;
 font-size: var(--n-font-size);
 word-break: break-word;
`,[S("checked",[i("dot",`
 background-color: var(--n-color-active);
 `)]),i("dot-wrapper",`
 position: relative;
 flex-shrink: 0;
 flex-grow: 0;
 width: var(--n-radio-size);
 `),M("radio-input",`
 position: absolute;
 border: 0;
 width: 0;
 height: 0;
 opacity: 0;
 margin: 0;
 `),i("dot",`
 position: absolute;
 top: 50%;
 left: 0;
 transform: translateY(-50%);
 height: var(--n-radio-size);
 width: var(--n-radio-size);
 background: var(--n-color);
 box-shadow: var(--n-box-shadow);
 border-radius: 50%;
 transition:
 background-color .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `,[D("&::before",`
 content: "";
 opacity: 0;
 position: absolute;
 left: 4px;
 top: 4px;
 height: calc(100% - 8px);
 width: calc(100% - 8px);
 border-radius: 50%;
 transform: scale(.8);
 background: var(--n-dot-color-active);
 transition: 
 opacity .3s var(--n-bezier),
 background-color .3s var(--n-bezier),
 transform .3s var(--n-bezier);
 `),S("checked",{boxShadow:"var(--n-box-shadow-active)"},[D("&::before",`
 opacity: 1;
 transform: scale(1);
 `)])]),i("label",`
 color: var(--n-text-color);
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 display: inline-block;
 transition: color .3s var(--n-bezier);
 `),Z("disabled",`
 cursor: pointer;
 `,[D("&:hover",[i("dot",{boxShadow:"var(--n-box-shadow-hover)"})]),S("focus",[D("&:not(:active)",[i("dot",{boxShadow:"var(--n-box-shadow-focus)"})])])]),S("disabled",`
 cursor: not-allowed;
 `,[i("dot",{boxShadow:"var(--n-box-shadow-disabled)",backgroundColor:"var(--n-color-disabled)"},[D("&::before",{backgroundColor:"var(--n-dot-color-disabled)"}),S("checked",`
 opacity: 1;
 `)]),i("label",{color:"var(--n-text-color-disabled)"}),M("radio-input",`
 cursor: not-allowed;
 `)])]),ro={name:String,value:{type:[String,Number,Boolean],default:"on"},checked:{type:Boolean,default:void 0},defaultChecked:Boolean,disabled:{type:Boolean,default:void 0},label:String,size:String,onUpdateChecked:[Function,Array],"onUpdate:checked":[Function,Array],checkedValue:{type:Boolean,default:void 0}},$e=Ge("n-radio-group");function no(e){const o=He($e,null),{mergedClsPrefixRef:r,mergedComponentPropsRef:l}=te(e),s=me(e,{mergedSize(f){var g,k;const{size:R}=e;if(R!==void 0)return R;if(o){const{mergedSizeRef:{value:c}}=o;if(c!==void 0)return c}if(f)return f.mergedSize.value;const B=(k=(g=l==null?void 0:l.value)===null||g===void 0?void 0:g.Radio)===null||k===void 0?void 0:k.size;return B||"medium"},mergedDisabled(f){return!!(e.disabled||o!=null&&o.disabledRef.value||f!=null&&f.disabled.value)}}),{mergedSizeRef:p,mergedDisabledRef:u}=s,h=T(null),b=T(null),x=T(e.defaultChecked),y=ee(e,"checked"),d=xe(y,x),a=Ce(()=>o?o.valueRef.value===e.value:d.value),t=Ce(()=>{const{name:f}=e;if(f!==void 0)return f;if(o)return o.nameRef.value}),m=T(!1);function n(){if(o){const{doUpdateValue:f}=o,{value:g}=e;K(f,g)}else{const{onUpdateChecked:f,"onUpdate:checked":g}=e,{nTriggerFormInput:k,nTriggerFormChange:R}=s;f&&K(f,!0),g&&K(g,!0),k(),R(),x.value=!0}}function v(){u.value||a.value||n()}function A(){v(),h.value&&(h.value.checked=a.value)}function N(){m.value=!1}function U(){m.value=!0}return{mergedClsPrefix:o?o.mergedClsPrefixRef:r,inputRef:h,labelRef:b,mergedName:t,mergedDisabled:u,renderSafeChecked:a,focus:m,mergedSize:p,handleRadioInputChange:A,handleRadioInputBlur:N,handleRadioInputFocus:U}}const io=Object.assign(Object.assign({},q.props),ro),lo=oe({name:"Radio",props:io,setup(e){const o=no(e),r=q("Radio","-radio",ao,Be,e,o.mergedClsPrefix),l=O(()=>{const{mergedSize:{value:x}}=o,{common:{cubicBezierEaseInOut:y},self:{boxShadow:d,boxShadowActive:a,boxShadowDisabled:t,boxShadowFocus:m,boxShadowHover:n,color:v,colorDisabled:A,colorActive:N,textColor:U,textColorDisabled:f,dotColorActive:g,dotColorDisabled:k,labelPadding:R,labelLineHeight:B,labelFontWeight:c,[H("fontSize",x)]:V,[H("radioSize",x)]:F}}=r.value;return{"--n-bezier":y,"--n-label-line-height":B,"--n-label-font-weight":c,"--n-box-shadow":d,"--n-box-shadow-active":a,"--n-box-shadow-disabled":t,"--n-box-shadow-focus":m,"--n-box-shadow-hover":n,"--n-color":v,"--n-color-active":N,"--n-color-disabled":A,"--n-dot-color-active":g,"--n-dot-color-disabled":k,"--n-font-size":V,"--n-radio-size":F,"--n-text-color":U,"--n-text-color-disabled":f,"--n-label-padding":R}}),{inlineThemeDisabled:s,mergedClsPrefixRef:p,mergedRtlRef:u}=te(e),h=ze("Radio",u,p),b=s?we("radio",O(()=>o.mergedSize.value[0]),l,e):void 0;return Object.assign(o,{rtlEnabled:h,cssVars:s?void 0:l,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender})},render(){const{$slots:e,mergedClsPrefix:o,onRender:r,label:l}=this;return r==null||r(),w("label",{class:[`${o}-radio`,this.themeClass,this.rtlEnabled&&`${o}-radio--rtl`,this.mergedDisabled&&`${o}-radio--disabled`,this.renderSafeChecked&&`${o}-radio--checked`,this.focus&&`${o}-radio--focus`],style:this.cssVars},w("div",{class:`${o}-radio__dot-wrapper`}," ",w("div",{class:[`${o}-radio__dot`,this.renderSafeChecked&&`${o}-radio__dot--checked`]}),w("input",{ref:"inputRef",type:"radio",class:`${o}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur})),W(e.default,s=>!s&&!l?null:w("div",{ref:"labelRef",class:`${o}-radio__label`},s||l)))}}),so=M("radio-group",`
 display: inline-block;
 font-size: var(--n-font-size);
`,[i("splitor",`
 display: inline-block;
 vertical-align: bottom;
 width: 1px;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 background: var(--n-button-border-color);
 `,[S("checked",{backgroundColor:"var(--n-button-border-color-active)"}),S("disabled",{opacity:"var(--n-opacity-disabled)"})]),S("button-group",`
 white-space: nowrap;
 height: var(--n-height);
 line-height: var(--n-height);
 `,[M("radio-button",{height:"var(--n-height)",lineHeight:"var(--n-height)"}),i("splitor",{height:"var(--n-height)"})]),M("radio-button",`
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
 `,[M("radio-input",`
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
 `),i("state-border",`
 z-index: 1;
 pointer-events: none;
 position: absolute;
 box-shadow: var(--n-button-box-shadow);
 transition: box-shadow .3s var(--n-bezier);
 left: -1px;
 bottom: -1px;
 right: -1px;
 top: -1px;
 `),D("&:first-child",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 border-left: 1px solid var(--n-button-border-color);
 `,[i("state-border",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 `)]),D("&:last-child",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 border-right: 1px solid var(--n-button-border-color);
 `,[i("state-border",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 `)]),Z("disabled",`
 cursor: pointer;
 `,[D("&:hover",[i("state-border",`
 transition: box-shadow .3s var(--n-bezier);
 box-shadow: var(--n-button-box-shadow-hover);
 `),Z("checked",{color:"var(--n-button-text-color-hover)"})]),S("focus",[D("&:not(:active)",[i("state-border",{boxShadow:"var(--n-button-box-shadow-focus)"})])])]),S("checked",`
 background: var(--n-button-color-active);
 color: var(--n-button-text-color-active);
 border-color: var(--n-button-border-color-active);
 `),S("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `)])]);function co(e,o,r){var l;const s=[];let p=!1;for(let u=0;u<e.length;++u){const h=e[u],b=(l=h.type)===null||l===void 0?void 0:l.name;b==="RadioButton"&&(p=!0);const x=h.props;if(b!=="RadioButton"){s.push(h);continue}if(u===0)s.push(h);else{const y=s[s.length-1].props,d=o===y.value,a=y.disabled,t=o===x.value,m=x.disabled,n=(d?2:0)+(a?0:1),v=(t?2:0)+(m?0:1),A={[`${r}-radio-group__splitor--disabled`]:a,[`${r}-radio-group__splitor--checked`]:d},N={[`${r}-radio-group__splitor--disabled`]:m,[`${r}-radio-group__splitor--checked`]:t},U=n<v?N:A;s.push(w("div",{class:[`${r}-radio-group__splitor`,U]}),h)}}return{children:s,isButtonGroup:p}}const uo=Object.assign(Object.assign({},q.props),{name:String,value:[String,Number,Boolean],defaultValue:{type:[String,Number,Boolean],default:null},size:String,disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),bo=oe({name:"RadioGroup",props:uo,setup(e){const o=T(null),{mergedSizeRef:r,mergedDisabledRef:l,nTriggerFormChange:s,nTriggerFormInput:p,nTriggerFormBlur:u,nTriggerFormFocus:h}=me(e),{mergedClsPrefixRef:b,inlineThemeDisabled:x,mergedRtlRef:y}=te(e),d=q("Radio","-radio-group",so,Be,e,b),a=T(e.defaultValue),t=ee(e,"value"),m=xe(t,a);function n(g){const{onUpdateValue:k,"onUpdate:value":R}=e;k&&K(k,g),R&&K(R,g),a.value=g,s(),p()}function v(g){const{value:k}=o;k&&(k.contains(g.relatedTarget)||h())}function A(g){const{value:k}=o;k&&(k.contains(g.relatedTarget)||u())}Ue($e,{mergedClsPrefixRef:b,nameRef:ee(e,"name"),valueRef:m,disabledRef:l,mergedSizeRef:r,doUpdateValue:n});const N=ze("Radio",y,b),U=O(()=>{const{value:g}=r,{common:{cubicBezierEaseInOut:k},self:{buttonBorderColor:R,buttonBorderColorActive:B,buttonBorderRadius:c,buttonBoxShadow:V,buttonBoxShadowFocus:F,buttonBoxShadowHover:j,buttonColor:Q,buttonColorActive:X,buttonTextColor:ae,buttonTextColorActive:re,buttonTextColorHover:ne,opacityDisabled:ie,[H("buttonHeight",g)]:I,[H("fontSize",g)]:le}}=d.value;return{"--n-font-size":le,"--n-bezier":k,"--n-button-border-color":R,"--n-button-border-color-active":B,"--n-button-border-radius":c,"--n-button-box-shadow":V,"--n-button-box-shadow-focus":F,"--n-button-box-shadow-hover":j,"--n-button-color":Q,"--n-button-color-active":X,"--n-button-text-color":ae,"--n-button-text-color-hover":ne,"--n-button-text-color-active":re,"--n-height":I,"--n-opacity-disabled":ie}}),f=x?we("radio-group",O(()=>r.value[0]),U,e):void 0;return{selfElRef:o,rtlEnabled:N,mergedClsPrefix:b,mergedValue:m,handleFocusout:A,handleFocusin:v,cssVars:x?void 0:U,themeClass:f==null?void 0:f.themeClass,onRender:f==null?void 0:f.onRender}},render(){var e;const{mergedValue:o,mergedClsPrefix:r,handleFocusin:l,handleFocusout:s}=this,{children:p,isButtonGroup:u}=co(Xe(eo(this)),o,r);return(e=this.onRender)===null||e===void 0||e.call(this),w("div",{onFocusin:l,onFocusout:s,ref:"selfElRef",class:[`${r}-radio-group`,this.rtlEnabled&&`${r}-radio-group--rtl`,this.themeClass,u&&`${r}-radio-group--button-group`],style:this.cssVars},p)}}),ho={buttonHeightSmall:"14px",buttonHeightMedium:"18px",buttonHeightLarge:"22px",buttonWidthSmall:"14px",buttonWidthMedium:"18px",buttonWidthLarge:"22px",buttonWidthPressedSmall:"20px",buttonWidthPressedMedium:"24px",buttonWidthPressedLarge:"28px",railHeightSmall:"18px",railHeightMedium:"22px",railHeightLarge:"26px",railWidthSmall:"32px",railWidthMedium:"40px",railWidthLarge:"48px"};function vo(e){const{primaryColor:o,opacityDisabled:r,borderRadius:l,textColor3:s}=e;return Object.assign(Object.assign({},ho),{iconColor:s,textColor:"white",loadingColor:o,opacityDisabled:r,railColor:"rgba(0, 0, 0, .14)",railColorActive:o,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:l,railBorderRadiusMedium:l,railBorderRadiusLarge:l,buttonBorderRadiusSmall:l,buttonBorderRadiusMedium:l,buttonBorderRadiusLarge:l,boxShadowFocus:`0 0 0 2px ${ge(o,{alpha:.2})}`})}const fo={common:Re,self:vo},po=M("switch",`
 height: var(--n-height);
 min-width: var(--n-width);
 vertical-align: middle;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 outline: none;
 justify-content: center;
 align-items: center;
`,[i("children-placeholder",`
 height: var(--n-rail-height);
 display: flex;
 flex-direction: column;
 overflow: hidden;
 pointer-events: none;
 visibility: hidden;
 `),i("rail-placeholder",`
 display: flex;
 flex-wrap: none;
 `),i("button-placeholder",`
 width: calc(1.75 * var(--n-rail-height));
 height: var(--n-rail-height);
 `),M("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[_e({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),i("checked, unchecked",`
 transition: color .3s var(--n-bezier);
 color: var(--n-text-color);
 box-sizing: border-box;
 position: absolute;
 white-space: nowrap;
 top: 0;
 bottom: 0;
 display: flex;
 align-items: center;
 line-height: 1;
 `),i("checked",`
 right: 0;
 padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),i("unchecked",`
 left: 0;
 justify-content: flex-end;
 padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),D("&:focus",[i("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),S("round",[i("rail","border-radius: calc(var(--n-rail-height) / 2);",[i("button","border-radius: calc(var(--n-button-height) / 2);")])]),Z("disabled",[Z("icon",[S("rubber-band",[S("pressed",[i("rail",[i("button","max-width: var(--n-button-width-pressed);")])]),i("rail",[D("&:active",[i("button","max-width: var(--n-button-width-pressed);")])]),S("active",[S("pressed",[i("rail",[i("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),i("rail",[D("&:active",[i("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),S("active",[i("rail",[i("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),i("rail",`
 overflow: hidden;
 height: var(--n-rail-height);
 min-width: var(--n-rail-width);
 border-radius: var(--n-rail-border-radius);
 cursor: pointer;
 position: relative;
 transition:
 opacity .3s var(--n-bezier),
 background .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 background-color: var(--n-rail-color);
 `,[i("button-icon",`
 color: var(--n-icon-color);
 transition: color .3s var(--n-bezier);
 font-size: calc(var(--n-button-height) - 4px);
 position: absolute;
 left: 0;
 right: 0;
 top: 0;
 bottom: 0;
 display: flex;
 justify-content: center;
 align-items: center;
 line-height: 1;
 `,[_e()]),i("button",`
 align-items: center; 
 top: var(--n-offset);
 left: var(--n-offset);
 height: var(--n-button-height);
 width: var(--n-button-width-pressed);
 max-width: var(--n-button-width);
 border-radius: var(--n-button-border-radius);
 background-color: var(--n-button-color);
 box-shadow: var(--n-button-box-shadow);
 box-sizing: border-box;
 cursor: inherit;
 content: "";
 position: absolute;
 transition:
 background-color .3s var(--n-bezier),
 left .3s var(--n-bezier),
 opacity .3s var(--n-bezier),
 max-width .3s var(--n-bezier),
 box-shadow .3s var(--n-bezier);
 `)]),S("active",[i("rail","background-color: var(--n-rail-color-active);")]),S("loading",[i("rail",`
 cursor: wait;
 `)]),S("disabled",[i("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]),go=Object.assign(Object.assign({},q.props),{size:String,value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},spinProps:Object,onChange:[Function,Array]});let J;const mo=oe({name:"Switch",props:go,slots:Object,setup(e){J===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?J=CSS.supports("width","max(1px)"):J=!1:J=!0);const{mergedClsPrefixRef:o,inlineThemeDisabled:r,mergedComponentPropsRef:l}=te(e),s=q("Switch","-switch",po,fo,e,o),p=me(e,{mergedSize(c){var V,F;if(e.size!==void 0)return e.size;if(c)return c.mergedSize.value;const j=(F=(V=l==null?void 0:l.value)===null||V===void 0?void 0:V.Switch)===null||F===void 0?void 0:F.size;return j||"medium"}}),{mergedSizeRef:u,mergedDisabledRef:h}=p,b=T(e.defaultValue),x=ee(e,"value"),y=xe(x,b),d=O(()=>y.value===e.checkedValue),a=T(!1),t=T(!1),m=O(()=>{const{railStyle:c}=e;if(c)return c({focused:t.value,checked:d.value})});function n(c){const{"onUpdate:value":V,onChange:F,onUpdateValue:j}=e,{nTriggerFormInput:Q,nTriggerFormChange:X}=p;V&&K(V,c),j&&K(j,c),F&&K(F,c),b.value=c,Q(),X()}function v(){const{nTriggerFormFocus:c}=p;c()}function A(){const{nTriggerFormBlur:c}=p;c()}function N(){e.loading||h.value||(y.value!==e.checkedValue?n(e.checkedValue):n(e.uncheckedValue))}function U(){t.value=!0,v()}function f(){t.value=!1,A(),a.value=!1}function g(c){e.loading||h.value||c.key===" "&&(y.value!==e.checkedValue?n(e.checkedValue):n(e.uncheckedValue),a.value=!1)}function k(c){e.loading||h.value||c.key===" "&&(c.preventDefault(),a.value=!0)}const R=O(()=>{const{value:c}=u,{self:{opacityDisabled:V,railColor:F,railColorActive:j,buttonBoxShadow:Q,buttonColor:X,boxShadowFocus:ae,loadingColor:re,textColor:ne,iconColor:ie,[H("buttonHeight",c)]:I,[H("buttonWidth",c)]:le,[H("buttonWidthPressed",c)]:Ve,[H("railHeight",c)]:L,[H("railWidth",c)]:Y,[H("railBorderRadius",c)]:Fe,[H("buttonBorderRadius",c)]:Pe},common:{cubicBezierEaseInOut:De}}=s.value;let se,de,ce;return J?(se=`calc((${L} - ${I}) / 2)`,de=`max(${L}, ${I})`,ce=`max(${Y}, calc(${Y} + ${I} - ${L}))`):(se=pe((E(L)-E(I))/2),de=pe(Math.max(E(L),E(I))),ce=E(L)>E(I)?Y:pe(E(Y)+E(I)-E(L))),{"--n-bezier":De,"--n-button-border-radius":Pe,"--n-button-box-shadow":Q,"--n-button-color":X,"--n-button-width":le,"--n-button-width-pressed":Ve,"--n-button-height":I,"--n-height":de,"--n-offset":se,"--n-opacity-disabled":V,"--n-rail-border-radius":Fe,"--n-rail-color":F,"--n-rail-color-active":j,"--n-rail-height":L,"--n-rail-width":Y,"--n-width":ce,"--n-box-shadow-focus":ae,"--n-loading-color":re,"--n-text-color":ne,"--n-icon-color":ie}}),B=r?we("switch",O(()=>u.value[0]),R,e):void 0;return{handleClick:N,handleBlur:f,handleFocus:U,handleKeyup:g,handleKeydown:k,mergedRailStyle:m,pressed:a,mergedClsPrefix:o,mergedValue:y,checked:d,mergedDisabled:h,cssVars:r?void 0:R,themeClass:B==null?void 0:B.themeClass,onRender:B==null?void 0:B.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:o,checked:r,mergedRailStyle:l,onRender:s,$slots:p}=this;s==null||s();const{checked:u,unchecked:h,icon:b,"checked-icon":x,"unchecked-icon":y}=p,d=!(fe(b)&&fe(x)&&fe(y));return w("div",{role:"switch","aria-checked":r,class:[`${e}-switch`,this.themeClass,d&&`${e}-switch--icon`,r&&`${e}-switch--active`,o&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`],tabindex:this.mergedDisabled?void 0:0,style:this.cssVars,onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},w("div",{class:`${e}-switch__rail`,"aria-hidden":"true",style:l},W(u,a=>W(h,t=>a||t?w("div",{"aria-hidden":!0,class:`${e}-switch__children-placeholder`},w("div",{class:`${e}-switch__rail-placeholder`},w("div",{class:`${e}-switch__button-placeholder`}),a),w("div",{class:`${e}-switch__rail-placeholder`},w("div",{class:`${e}-switch__button-placeholder`}),t)):null)),w("div",{class:`${e}-switch__button`},W(b,a=>W(x,t=>W(y,m=>w(qe,null,{default:()=>this.loading?w(Qe,Object.assign({key:"loading",clsPrefix:e,strokeWidth:20},this.spinProps)):this.checked&&(t||a)?w("div",{class:`${e}-switch__button-icon`,key:t?"checked-icon":"icon"},t||a):!this.checked&&(m||a)?w("div",{class:`${e}-switch__button-icon`,key:m?"unchecked-icon":"icon"},m||a):null})))),W(u,a=>a&&w("div",{key:"checked",class:`${e}-switch__checked`},a)),W(h,a=>a&&w("div",{key:"unchecked",class:`${e}-switch__unchecked`},a)))))}}),xo={class:"settings-view"},wo={key:0,class:"feedback error",role:"alert"},yo={key:1,class:"loading-panel",role:"status"},ko={key:2,class:"empty-panel"},So=["onSubmit"],Co={class:"panel-heading"},_o={class:"setting-copy"},Ro={class:"radio-options"},zo={class:"radio-copy"},Bo={key:0},$o={key:0,class:"feedback error",role:"alert"},Vo={key:1,class:"feedback success",role:"status"},Fo=oe({__name:"SettingsView",setup(e){const o=Me(),r=je({}),l=T(""),s=Le({queryKey:["settings","schema"],queryFn:()=>Se.get("/setting/schema")}),p=O(()=>{var d;return((d=s.data.value)==null?void 0:d.apps)??[]});Ie(p,d=>{Object.keys(r).forEach(a=>delete r[a]),d.forEach(a=>{r[a.app_name]=Object.fromEntries(a.settings.map(t=>[t.key,t.value]))})},{immediate:!0});const u=We({mutationFn:d=>Se.post("/setting",{app_name:d.app_name,settings:{...r[d.app_name]}}),onMutate:()=>{l.value=""},onSuccess:async(d,a)=>{l.value=a.app_name,await o.invalidateQueries({queryKey:["settings","schema"]})}});function h(d,a){var t;return((t=r[d])==null?void 0:t[a.key])??a.default}function b(d,a,t){t!==null&&r[d]&&(r[d][a]=t)}function x(d,a){const t=h(d,a);return typeof t=="boolean"?String(Number(t)):t}function y(d){var a;return u.isPending.value&&((a=u.variables.value)==null?void 0:a.app_name)===d}return(d,a)=>(C(),P("div",xo,[ye(Ke,{title:"团队设置",description:"配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。"}),_(s).isError.value?(C(),P("p",wo,$(_(ke)(_(s).error.value)),1)):_(s).isPending.value?(C(),P("div",yo,"正在加载团队设置…")):p.value.length?(C(!0),P(ue,{key:3},be(p.value,t=>{var m;return C(),P("form",{key:t.app_name,class:"settings-panel",onSubmit:Te(n=>_(u).mutate(t),["prevent"])},[z("header",Co,[z("div",null,[z("p",null,$(t.app_name.toUpperCase()),1),z("h2",null,$(t.label),1),z("span",null,$(t.description),1)]),ye(Oe,{type:"submit",loading:y(t.app_name),disabled:_(u).isPending.value},{default:he(()=>[Ae(" 保存"+$(t.label)+"设置 ",1)]),_:2},1032,["loading","disabled"])]),(C(!0),P(ue,null,be(t.settings,n=>(C(),P("section",{key:n.key,class:Ne(["setting-row",{"setting-row--stacked":n.control==="radio"}])},[z("div",_o,[z("h3",null,$(n.label),1),z("p",null,$(n.description),1),z("code",null,$(t.app_name)+"."+$(n.key),1)]),n.control==="switch"?(C(),G(_(mo),{key:0,value:!!h(t.app_name,n),"aria-label":n.label,"onUpdate:value":v=>b(t.app_name,n.key,v)},null,8,["value","aria-label","onUpdate:value"])):n.control==="radio"?(C(),G(_(bo),{key:1,value:x(t.app_name,n),"aria-label":n.label,"onUpdate:value":v=>b(t.app_name,n.key,v)},{default:he(()=>[z("div",Ro,[(C(!0),P(ue,null,be(n.options??[],v=>(C(),G(_(lo),{key:String(v.value),value:v.value},{default:he(()=>[z("span",zo,[z("strong",null,$(v.label),1),v.description?(C(),P("small",Bo,$(v.description),1)):ve("",!0)])]),_:2},1032,["value"]))),128))])]),_:2},1032,["value","aria-label","onUpdate:value"])):n.control==="select"?(C(),G(_(Ye),{key:2,value:x(t.app_name,n),options:n.options??[],"aria-label":n.label,"onUpdate:value":v=>b(t.app_name,n.key,v)},null,8,["value","options","aria-label","onUpdate:value"])):n.control==="number"?(C(),G(_(Je),{key:3,value:Number(h(t.app_name,n)),min:n.min,max:n.max,step:n.step,"aria-label":n.label,"onUpdate:value":v=>b(t.app_name,n.key,v)},null,8,["value","min","max","step","aria-label","onUpdate:value"])):(C(),G(_(Ze),{key:4,value:String(h(t.app_name,n)),maxlength:n.max_length,"aria-label":n.label,"onUpdate:value":v=>b(t.app_name,n.key,v)},null,8,["value","maxlength","aria-label","onUpdate:value"]))],2))),128)),_(u).isError.value&&((m=_(u).variables.value)==null?void 0:m.app_name)===t.app_name?(C(),P("p",$o,$(_(ke)(_(u).error.value)),1)):ve("",!0),l.value===t.app_name?(C(),P("p",Vo,$(t.label)+"设置已保存。 ",1)):ve("",!0)],40,So)}),128)):(C(),P("div",ko,[...a[0]||(a[0]=[z("h2",null,"当前没有可配置项",-1),z("p",null,"应用登记团队设置后会自动显示在这里。",-1)])]))]))}}),Go=Ee(Fo,[["__scopeId","data-v-0cf4b689"]]);export{Go as default};
