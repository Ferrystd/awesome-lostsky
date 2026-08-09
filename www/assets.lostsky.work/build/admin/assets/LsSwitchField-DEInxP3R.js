import{L as $e}from"./LsPanel-gLmd8FIT.js";import{L as Be}from"./LsSectionHeader-Bh-50JEe.js";import{L as Ce,al as Re,Q,T as a,aV as G,O as D,V as v,aq as J,d as Y,bo as H,k as l,$,aD as Ve,aE as Le,W as ze,a2 as te,ar as _e,n as N,as as Fe,a4 as Te,i as h,au as K,a8 as B,aM as U,ap as f,a1 as We,e as ae,w as T,u as X,D as ie,o as F,g as oe,b as ne,bp as le,x as Z,m as re,a as A,j as E,t as z,v as Oe,h as ee}from"./index-Dt3fUKCm.js";const Pe={buttonHeightSmall:"14px",buttonHeightMedium:"18px",buttonHeightLarge:"22px",buttonWidthSmall:"14px",buttonWidthMedium:"18px",buttonWidthLarge:"22px",buttonWidthPressedSmall:"20px",buttonWidthPressedMedium:"24px",buttonWidthPressedLarge:"28px",railHeightSmall:"18px",railHeightMedium:"22px",railHeightLarge:"26px",railWidthSmall:"32px",railWidthMedium:"40px",railWidthLarge:"48px"};function Ie(e){const{primaryColor:u,opacityDisabled:o,borderRadius:n,textColor3:r}=e;return Object.assign(Object.assign({},Pe),{iconColor:r,textColor:"white",loadingColor:u,opacityDisabled:o,railColor:"rgba(0, 0, 0, .14)",railColorActive:u,buttonBoxShadow:"0 1px 4px 0 rgba(0, 0, 0, 0.3), inset 0 0 1px 0 rgba(0, 0, 0, 0.05)",buttonColor:"#FFF",railBorderRadiusSmall:n,railBorderRadiusMedium:n,railBorderRadiusLarge:n,buttonBorderRadiusSmall:n,buttonBorderRadiusMedium:n,buttonBorderRadiusLarge:n,boxShadowFocus:`0 0 0 2px ${Re(u,{alpha:.2})}`})}const Me={common:Ce,self:Ie},je=Q("switch",`
 height: var(--n-height);
 min-width: var(--n-width);
 vertical-align: middle;
 user-select: none;
 -webkit-user-select: none;
 display: inline-flex;
 outline: none;
 justify-content: center;
 align-items: center;
`,[a("children-placeholder",`
 height: var(--n-rail-height);
 display: flex;
 flex-direction: column;
 overflow: hidden;
 pointer-events: none;
 visibility: hidden;
 `),a("rail-placeholder",`
 display: flex;
 flex-wrap: none;
 `),a("button-placeholder",`
 width: calc(1.75 * var(--n-rail-height));
 height: var(--n-rail-height);
 `),Q("base-loading",`
 position: absolute;
 top: 50%;
 left: 50%;
 transform: translateX(-50%) translateY(-50%);
 font-size: calc(var(--n-button-width) - 4px);
 color: var(--n-loading-color);
 transition: color .3s var(--n-bezier);
 `,[G({left:"50%",top:"50%",originalTransform:"translateX(-50%) translateY(-50%)"})]),a("checked, unchecked",`
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
 `),a("checked",`
 right: 0;
 padding-right: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),a("unchecked",`
 left: 0;
 justify-content: flex-end;
 padding-left: calc(1.25 * var(--n-rail-height) - var(--n-offset));
 `),D("&:focus",[a("rail",`
 box-shadow: var(--n-box-shadow-focus);
 `)]),v("round",[a("rail","border-radius: calc(var(--n-rail-height) / 2);",[a("button","border-radius: calc(var(--n-button-height) / 2);")])]),J("disabled",[J("icon",[v("rubber-band",[v("pressed",[a("rail",[a("button","max-width: var(--n-button-width-pressed);")])]),a("rail",[D("&:active",[a("button","max-width: var(--n-button-width-pressed);")])]),v("active",[v("pressed",[a("rail",[a("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])]),a("rail",[D("&:active",[a("button","left: calc(100% - var(--n-offset) - var(--n-button-width-pressed));")])])])])])]),v("active",[a("rail",[a("button","left: calc(100% - var(--n-button-width) - var(--n-offset))")])]),a("rail",`
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
 `,[a("button-icon",`
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
 `,[G()]),a("button",`
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
 `)]),v("active",[a("rail","background-color: var(--n-rail-color-active);")]),v("loading",[a("rail",`
 cursor: wait;
 `)]),v("disabled",[a("rail",`
 cursor: not-allowed;
 opacity: .5;
 `)])]),De=Object.assign(Object.assign({},te.props),{size:String,value:{type:[String,Number,Boolean],default:void 0},loading:Boolean,defaultValue:{type:[String,Number,Boolean],default:!1},disabled:{type:Boolean,default:void 0},round:{type:Boolean,default:!0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array],checkedValue:{type:[String,Number,Boolean],default:!0},uncheckedValue:{type:[String,Number,Boolean],default:!1},railStyle:Function,rubberBand:{type:Boolean,default:!0},spinProps:Object,onChange:[Function,Array]});let _;const He=Y({name:"Switch",props:De,slots:Object,setup(e){_===void 0&&(typeof CSS<"u"?typeof CSS.supports<"u"?_=CSS.supports("width","max(1px)"):_=!1:_=!0);const{mergedClsPrefixRef:u,inlineThemeDisabled:o,mergedComponentPropsRef:n}=ze(e),r=te("Switch","-switch",je,Me,e,u),s=_e(e,{mergedSize(t){var w,p;if(e.size!==void 0)return e.size;if(t)return t.mergedSize.value;const S=(p=(w=n==null?void 0:n.value)===null||w===void 0?void 0:w.Switch)===null||p===void 0?void 0:p.size;return S||"medium"}}),{mergedSizeRef:g,mergedDisabledRef:b}=s,m=N(e.defaultValue),C=We(e,"value"),d=Fe(C,m),R=h(()=>d.value===e.checkedValue),i=N(!1),c=N(!1),k=h(()=>{const{railStyle:t}=e;if(t)return t({focused:c.value,checked:R.value})});function W(t){const{"onUpdate:value":w,onChange:p,onUpdateValue:S}=e,{nTriggerFormInput:O,nTriggerFormChange:P}=s;w&&K(w,t),S&&K(S,t),p&&K(p,t),m.value=t,O(),P()}function se(){const{nTriggerFormFocus:t}=s;t()}function de(){const{nTriggerFormBlur:t}=s;t()}function ce(){e.loading||b.value||(d.value!==e.checkedValue?W(e.checkedValue):W(e.uncheckedValue))}function ue(){c.value=!0,se()}function he(){c.value=!1,de(),i.value=!1}function be(t){e.loading||b.value||t.key===" "&&(d.value!==e.checkedValue?W(e.checkedValue):W(e.uncheckedValue),i.value=!1)}function ve(t){e.loading||b.value||t.key===" "&&(t.preventDefault(),i.value=!0)}const q=h(()=>{const{value:t}=g,{self:{opacityDisabled:w,railColor:p,railColorActive:S,buttonBoxShadow:O,buttonColor:P,boxShadowFocus:fe,loadingColor:ge,textColor:me,iconColor:we,[B("buttonHeight",t)]:y,[B("buttonWidth",t)]:pe,[B("buttonWidthPressed",t)]:ye,[B("railHeight",t)]:x,[B("railWidth",t)]:L,[B("railBorderRadius",t)]:xe,[B("buttonBorderRadius",t)]:ke},common:{cubicBezierEaseInOut:Se}}=r.value;let I,M,j;return _?(I=`calc((${x} - ${y}) / 2)`,M=`max(${x}, ${y})`,j=`max(${L}, calc(${L} + ${y} - ${x}))`):(I=U((f(x)-f(y))/2),M=U(Math.max(f(x),f(y))),j=f(x)>f(y)?L:U(f(L)+f(y)-f(x))),{"--n-bezier":Se,"--n-button-border-radius":ke,"--n-button-box-shadow":O,"--n-button-color":P,"--n-button-width":pe,"--n-button-width-pressed":ye,"--n-button-height":y,"--n-height":M,"--n-offset":I,"--n-opacity-disabled":w,"--n-rail-border-radius":xe,"--n-rail-color":p,"--n-rail-color-active":S,"--n-rail-height":x,"--n-rail-width":L,"--n-width":j,"--n-box-shadow-focus":fe,"--n-loading-color":ge,"--n-text-color":me,"--n-icon-color":we}}),V=o?Te("switch",h(()=>g.value[0]),q,e):void 0;return{handleClick:ce,handleBlur:he,handleFocus:ue,handleKeyup:be,handleKeydown:ve,mergedRailStyle:k,pressed:i,mergedClsPrefix:u,mergedValue:d,checked:R,mergedDisabled:b,cssVars:o?void 0:q,themeClass:V==null?void 0:V.themeClass,onRender:V==null?void 0:V.onRender}},render(){const{mergedClsPrefix:e,mergedDisabled:u,checked:o,mergedRailStyle:n,onRender:r,$slots:s}=this;r==null||r();const{checked:g,unchecked:b,icon:m,"checked-icon":C,"unchecked-icon":d}=s,R=!(H(m)&&H(C)&&H(d));return l("div",{role:"switch","aria-checked":o,class:[`${e}-switch`,this.themeClass,R&&`${e}-switch--icon`,o&&`${e}-switch--active`,u&&`${e}-switch--disabled`,this.round&&`${e}-switch--round`,this.loading&&`${e}-switch--loading`,this.pressed&&`${e}-switch--pressed`,this.rubberBand&&`${e}-switch--rubber-band`],tabindex:this.mergedDisabled?void 0:0,style:this.cssVars,onClick:this.handleClick,onFocus:this.handleFocus,onBlur:this.handleBlur,onKeyup:this.handleKeyup,onKeydown:this.handleKeydown},l("div",{class:`${e}-switch__rail`,"aria-hidden":"true",style:n},$(g,i=>$(b,c=>i||c?l("div",{"aria-hidden":!0,class:`${e}-switch__children-placeholder`},l("div",{class:`${e}-switch__rail-placeholder`},l("div",{class:`${e}-switch__button-placeholder`}),i),l("div",{class:`${e}-switch__rail-placeholder`},l("div",{class:`${e}-switch__button-placeholder`}),c)):null)),l("div",{class:`${e}-switch__button`},$(m,i=>$(C,c=>$(d,k=>l(Ve,null,{default:()=>this.loading?l(Le,Object.assign({key:"loading",clsPrefix:e,strokeWidth:20},this.spinProps)):this.checked&&(c||i)?l("div",{class:`${e}-switch__button-icon`,key:c?"checked-icon":"icon"},c||i):!this.checked&&(k||i)?l("div",{class:`${e}-switch__button-icon`,key:k?"unchecked-icon":"icon"},k||i):null})))),$(g,i=>i&&l("div",{key:"checked",class:`${e}-switch__checked`},i)),$(b,i=>i&&l("div",{key:"unchecked",class:`${e}-switch__unchecked`},i)))))}}),Ne={class:"ls-form-section"},Ke=Y({__name:"LsFormSection",props:{title:{},description:{},eyebrow:{},id:{},headingLevel:{default:2}},setup(e){const u=e,o=ie(),n=u.id??`ls-form-section-${o}`;return(r,s)=>(F(),ae($e,{"aria-labelledby":X(n)},{default:T(()=>[oe("div",Ne,[ne(Be,{id:X(n),title:e.title,description:e.description,eyebrow:e.eyebrow,"heading-level":e.headingLevel},le({_:2},[r.$slots.aside?{name:"aside",fn:T(()=>[Z(r.$slots,"aside",{},void 0,!0)]),key:"0"}:void 0]),1032,["id","title","description","eyebrow","heading-level"]),Z(r.$slots,"default",{},void 0,!0)])]),_:3},8,["aria-labelledby"]))}}),Je=re(Ke,[["__scopeId","data-v-68efc440"]]),Ue=["data-disabled","title"],Ae={class:"ls-switch-field__copy"},Ee=["id"],Xe=["id"],Ye=Y({__name:"LsSwitchField",props:{modelValue:{type:Boolean},label:{},description:{default:""},id:{default:""},ariaLabel:{default:""},headingLevel:{},disabled:{type:Boolean},readOnly:{type:Boolean},loading:{type:Boolean},disabledReason:{default:""},checkedText:{default:""},uncheckedText:{default:""}},emits:["update:modelValue"],setup(e,{emit:u}){const o=e,n=u,r=ie(),s=h(()=>o.id||`ls-switch-field-${r}`),g=h(()=>`${s.value}-label`),b=h(()=>`${s.value}-description`),m=h(()=>`${s.value}-reason`),C=h(()=>o.headingLevel?`h${o.headingLevel}`:"span"),d=h(()=>o.disabled||o.readOnly),R=h(()=>{const i=[];return o.description&&i.push(b.value),d.value&&o.disabledReason&&i.push(m.value),i.join(" ")||void 0});return(i,c)=>(F(),A("div",{class:"ls-switch-field","data-disabled":d.value||void 0,title:d.value?e.disabledReason:void 0},[oe("span",Ae,[(F(),ae(Oe(C.value),{id:g.value,class:"ls-switch-field__label"},{default:T(()=>[E(z(e.label),1)]),_:1},8,["id"])),e.description?(F(),A("span",{key:0,id:b.value,class:"ls-switch-field__description"},z(e.description),9,Ee)):ee("",!0),d.value&&e.disabledReason?(F(),A("span",{key:1,id:m.value,class:"ls-switch-field__reason"},z(e.disabledReason),9,Xe)):ee("",!0)]),ne(X(He),{id:s.value,class:"ls-switch-field__control",value:e.modelValue,disabled:d.value,loading:e.loading,"aria-label":e.ariaLabel||void 0,"aria-labelledby":e.ariaLabel?void 0:g.value,"aria-describedby":R.value,"aria-readonly":e.readOnly||void 0,"onUpdate:value":c[0]||(c[0]=k=>n("update:modelValue",k))},le({_:2},[e.checkedText?{name:"checked",fn:T(()=>[E(z(e.checkedText),1)]),key:"0"}:void 0,e.uncheckedText?{name:"unchecked",fn:T(()=>[E(z(e.uncheckedText),1)]),key:"1"}:void 0]),1032,["id","value","disabled","loading","aria-label","aria-labelledby","aria-describedby","aria-readonly"])],8,Ue))}}),Ze=re(Ye,[["__scopeId","data-v-7dd9bda7"]]);export{Je as L,Ze as a};
