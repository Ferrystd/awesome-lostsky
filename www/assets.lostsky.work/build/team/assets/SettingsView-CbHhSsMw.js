import{a2 as xe,H as U,a4 as Q,f as J,X as I,d as P,a6 as ye,w as _e,i as R,k as Y,u as y,t as C,j as _,F as L,v as G,h as m,p as Z,K as ke,l as K,m as Ce,a5 as ee,x as E,q,J as we,z as oe,_ as Se}from"./index--6Kpy4Zw.js";import{L as Re}from"./LsButton-CeUUC-mt.js";import{u as ze}from"./useQueryClient-CZPj7Eb1.js";import{u as $e}from"./useQuery-Bq-BOFy0.js";import{u as Be}from"./useMutation-DPP3TpRA.js";import{A as Ve}from"./AdminPageHeader-BmYQg7UD.js";import{m as re,h as ne,d as H,b as Fe,u as ie,c as le}from"./Loading-Bt4hDgED.js";import{d as Ie,A as te,a as D,e as $,f as k,c as B,v as W,u as X,x as ae,l as Ue,h as j,j as T}from"./light-Ccjcu9At.js";import{j as De}from"./fade-in-scale-up.cssr-BWBgjQ9O.js";import{N as Ae}from"./Switch-BqHv4J4L.js";import{N as Ne}from"./Select-YsUKsiX_.js";import{N as Ee}from"./InputNumber-UZ_YA47V.js";import{N as He}from"./Input-iYyDxyoe.js";import"./queryObserver-CsoSMuo4.js";import"./arrow-left-DRGBLVnh.js";import"./use-false-until-truthy-NCm2iyUg.js";import"./index-BJKaMiZy.js";import"./Suffix-YEYgC8ub.js";import"./Tag-DPVCTFKc.js";import"./color-to-class-B0iQgAn2.js";import"./format-length-CLmkq7LL.js";import"./happens-in-CM8LO42l.js";import"./Button-Tgecffg0.js";import"./browser-DLIXj5nt.js";import"./is-browser-DqcmxZSF.js";function Pe(r,o="default",a=[]){const l=r.$slots[o];return l===void 0?a:l()}const Te={radioSizeSmall:"14px",radioSizeMedium:"16px",radioSizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function je(r){const{borderColor:o,primaryColor:a,baseColor:s,textColorDisabled:l,inputColorDisabled:g,textColor2:d,opacityDisabled:v,borderRadius:u,fontSizeSmall:x,fontSizeMedium:w,fontSizeLarge:p,heightSmall:n,heightMedium:i,heightLarge:e,lineHeight:S}=r;return Object.assign(Object.assign({},Te),{labelLineHeight:S,buttonHeightSmall:n,buttonHeightMedium:i,buttonHeightLarge:e,fontSizeSmall:x,fontSizeMedium:w,fontSizeLarge:p,boxShadow:`inset 0 0 0 1px ${o}`,boxShadowActive:`inset 0 0 0 1px ${a}`,boxShadowFocus:`inset 0 0 0 1px ${a}, 0 0 0 2px ${te(a,{alpha:.2})}`,boxShadowHover:`inset 0 0 0 1px ${a}`,boxShadowDisabled:`inset 0 0 0 1px ${o}`,color:s,colorDisabled:g,colorActive:"#0000",textColor:d,textColorDisabled:l,dotColorActive:a,dotColorDisabled:o,buttonBorderColor:o,buttonBorderColorActive:a,buttonBorderColorHover:o,buttonColor:s,buttonColorActive:s,buttonTextColor:d,buttonTextColorActive:a,buttonTextColorHover:a,opacityDisabled:v,buttonBoxShadowFocus:`inset 0 0 0 1px ${a}, 0 0 0 2px ${te(a,{alpha:.3})}`,buttonBoxShadowHover:"inset 0 0 0 1px #0000",buttonBoxShadow:"inset 0 0 0 1px #0000",buttonBorderRadius:u})}const se={common:Ie,self:je},Me=D("radio",`
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
`,[$("checked",[k("dot",`
 background-color: var(--n-color-active);
 `)]),k("dot-wrapper",`
 position: relative;
 flex-shrink: 0;
 flex-grow: 0;
 width: var(--n-radio-size);
 `),D("radio-input",`
 position: absolute;
 border: 0;
 width: 0;
 height: 0;
 opacity: 0;
 margin: 0;
 `),k("dot",`
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
 `,[B("&::before",`
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
 `),$("checked",{boxShadow:"var(--n-box-shadow-active)"},[B("&::before",`
 opacity: 1;
 transform: scale(1);
 `)])]),k("label",`
 color: var(--n-text-color);
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 display: inline-block;
 transition: color .3s var(--n-bezier);
 `),W("disabled",`
 cursor: pointer;
 `,[B("&:hover",[k("dot",{boxShadow:"var(--n-box-shadow-hover)"})]),$("focus",[B("&:not(:active)",[k("dot",{boxShadow:"var(--n-box-shadow-focus)"})])])]),$("disabled",`
 cursor: not-allowed;
 `,[k("dot",{boxShadow:"var(--n-box-shadow-disabled)",backgroundColor:"var(--n-color-disabled)"},[B("&::before",{backgroundColor:"var(--n-dot-color-disabled)"}),$("checked",`
 opacity: 1;
 `)]),k("label",{color:"var(--n-text-color-disabled)"}),D("radio-input",`
 cursor: not-allowed;
 `)])]),Oe={name:String,value:{type:[String,Number,Boolean],default:"on"},checked:{type:Boolean,default:void 0},defaultChecked:Boolean,disabled:{type:Boolean,default:void 0},label:String,size:String,onUpdateChecked:[Function,Array],"onUpdate:checked":[Function,Array],checkedValue:{type:Boolean,default:void 0}},de=Ue("n-radio-group");function Le(r){const o=xe(de,null),{mergedClsPrefixRef:a,mergedComponentPropsRef:s}=X(r),l=re(r,{mergedSize(b){var h,f;const{size:z}=r;if(z!==void 0)return z;if(o){const{mergedSizeRef:{value:N}}=o;if(N!==void 0)return N}if(b)return b.mergedSize.value;const A=(f=(h=s==null?void 0:s.value)===null||h===void 0?void 0:h.Radio)===null||f===void 0?void 0:f.size;return A||"medium"},mergedDisabled(b){return!!(r.disabled||o!=null&&o.disabledRef.value||b!=null&&b.disabled.value)}}),{mergedSizeRef:g,mergedDisabledRef:d}=l,v=U(null),u=U(null),x=U(r.defaultChecked),w=Q(r,"checked"),p=ne(w,x),n=ae(()=>o?o.valueRef.value===r.value:p.value),i=ae(()=>{const{name:b}=r;if(b!==void 0)return b;if(o)return o.nameRef.value}),e=U(!1);function S(){if(o){const{doUpdateValue:b}=o,{value:h}=r;H(b,h)}else{const{onUpdateChecked:b,"onUpdate:checked":h}=r,{nTriggerFormInput:f,nTriggerFormChange:z}=l;b&&H(b,!0),h&&H(h,!0),f(),z(),x.value=!0}}function t(){d.value||n.value||S()}function c(){t(),v.value&&(v.value.checked=n.value)}function F(){e.value=!1}function V(){e.value=!0}return{mergedClsPrefix:o?o.mergedClsPrefixRef:a,inputRef:v,labelRef:u,mergedName:i,mergedDisabled:d,renderSafeChecked:n,focus:e,mergedSize:g,handleRadioInputChange:c,handleRadioInputBlur:F,handleRadioInputFocus:V}}const Ge=Object.assign(Object.assign({},j.props),Oe),Ke=J({name:"Radio",props:Ge,setup(r){const o=Le(r),a=j("Radio","-radio",Me,se,r,o.mergedClsPrefix),s=P(()=>{const{mergedSize:{value:x}}=o,{common:{cubicBezierEaseInOut:w},self:{boxShadow:p,boxShadowActive:n,boxShadowDisabled:i,boxShadowFocus:e,boxShadowHover:S,color:t,colorDisabled:c,colorActive:F,textColor:V,textColorDisabled:b,dotColorActive:h,dotColorDisabled:f,labelPadding:z,labelLineHeight:A,labelFontWeight:N,[T("fontSize",x)]:M,[T("radioSize",x)]:O}}=a.value;return{"--n-bezier":w,"--n-label-line-height":A,"--n-label-font-weight":N,"--n-box-shadow":p,"--n-box-shadow-active":n,"--n-box-shadow-disabled":i,"--n-box-shadow-focus":e,"--n-box-shadow-hover":S,"--n-color":t,"--n-color-active":F,"--n-color-disabled":c,"--n-dot-color-active":h,"--n-dot-color-disabled":f,"--n-font-size":M,"--n-radio-size":O,"--n-text-color":V,"--n-text-color-disabled":b,"--n-label-padding":z}}),{inlineThemeDisabled:l,mergedClsPrefixRef:g,mergedRtlRef:d}=X(r),v=ie("Radio",d,g),u=l?le("radio",P(()=>o.mergedSize.value[0]),s,r):void 0;return Object.assign(o,{rtlEnabled:v,cssVars:l?void 0:s,themeClass:u==null?void 0:u.themeClass,onRender:u==null?void 0:u.onRender})},render(){const{$slots:r,mergedClsPrefix:o,onRender:a,label:s}=this;return a==null||a(),I("label",{class:[`${o}-radio`,this.themeClass,this.rtlEnabled&&`${o}-radio--rtl`,this.mergedDisabled&&`${o}-radio--disabled`,this.renderSafeChecked&&`${o}-radio--checked`,this.focus&&`${o}-radio--focus`],style:this.cssVars},I("div",{class:`${o}-radio__dot-wrapper`}," ",I("div",{class:[`${o}-radio__dot`,this.renderSafeChecked&&`${o}-radio__dot--checked`]}),I("input",{ref:"inputRef",type:"radio",class:`${o}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur})),Fe(r.default,l=>!l&&!s?null:I("div",{ref:"labelRef",class:`${o}-radio__label`},l||s)))}}),qe=D("radio-group",`
 display: inline-block;
 font-size: var(--n-font-size);
`,[k("splitor",`
 display: inline-block;
 vertical-align: bottom;
 width: 1px;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 background: var(--n-button-border-color);
 `,[$("checked",{backgroundColor:"var(--n-button-border-color-active)"}),$("disabled",{opacity:"var(--n-opacity-disabled)"})]),$("button-group",`
 white-space: nowrap;
 height: var(--n-height);
 line-height: var(--n-height);
 `,[D("radio-button",{height:"var(--n-height)",lineHeight:"var(--n-height)"}),k("splitor",{height:"var(--n-height)"})]),D("radio-button",`
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
 `,[D("radio-input",`
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
 `),k("state-border",`
 z-index: 1;
 pointer-events: none;
 position: absolute;
 box-shadow: var(--n-button-box-shadow);
 transition: box-shadow .3s var(--n-bezier);
 left: -1px;
 bottom: -1px;
 right: -1px;
 top: -1px;
 `),B("&:first-child",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 border-left: 1px solid var(--n-button-border-color);
 `,[k("state-border",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 `)]),B("&:last-child",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 border-right: 1px solid var(--n-button-border-color);
 `,[k("state-border",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 `)]),W("disabled",`
 cursor: pointer;
 `,[B("&:hover",[k("state-border",`
 transition: box-shadow .3s var(--n-bezier);
 box-shadow: var(--n-button-box-shadow-hover);
 `),W("checked",{color:"var(--n-button-text-color-hover)"})]),$("focus",[B("&:not(:active)",[k("state-border",{boxShadow:"var(--n-button-box-shadow-focus)"})])])]),$("checked",`
 background: var(--n-button-color-active);
 color: var(--n-button-text-color-active);
 border-color: var(--n-button-border-color-active);
 `),$("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `)])]);function Qe(r,o,a){var s;const l=[];let g=!1;for(let d=0;d<r.length;++d){const v=r[d],u=(s=v.type)===null||s===void 0?void 0:s.name;u==="RadioButton"&&(g=!0);const x=v.props;if(u!=="RadioButton"){l.push(v);continue}if(d===0)l.push(v);else{const w=l[l.length-1].props,p=o===w.value,n=w.disabled,i=o===x.value,e=x.disabled,S=(p?2:0)+(n?0:1),t=(i?2:0)+(e?0:1),c={[`${a}-radio-group__splitor--disabled`]:n,[`${a}-radio-group__splitor--checked`]:p},F={[`${a}-radio-group__splitor--disabled`]:e,[`${a}-radio-group__splitor--checked`]:i},V=S<t?F:c;l.push(I("div",{class:[`${a}-radio-group__splitor`,V]}),v)}}return{children:l,isButtonGroup:g}}const We=Object.assign(Object.assign({},j.props),{name:String,value:[String,Number,Boolean],defaultValue:{type:[String,Number,Boolean],default:null},size:String,disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),Je=J({name:"RadioGroup",props:We,setup(r){const o=U(null),{mergedSizeRef:a,mergedDisabledRef:s,nTriggerFormChange:l,nTriggerFormInput:g,nTriggerFormBlur:d,nTriggerFormFocus:v}=re(r),{mergedClsPrefixRef:u,inlineThemeDisabled:x,mergedRtlRef:w}=X(r),p=j("Radio","-radio-group",qe,se,r,u),n=U(r.defaultValue),i=Q(r,"value"),e=ne(i,n);function S(h){const{onUpdateValue:f,"onUpdate:value":z}=r;f&&H(f,h),z&&H(z,h),n.value=h,l(),g()}function t(h){const{value:f}=o;f&&(f.contains(h.relatedTarget)||v())}function c(h){const{value:f}=o;f&&(f.contains(h.relatedTarget)||d())}ye(de,{mergedClsPrefixRef:u,nameRef:Q(r,"name"),valueRef:e,disabledRef:s,mergedSizeRef:a,doUpdateValue:S});const F=ie("Radio",w,u),V=P(()=>{const{value:h}=a,{common:{cubicBezierEaseInOut:f},self:{buttonBorderColor:z,buttonBorderColorActive:A,buttonBorderRadius:N,buttonBoxShadow:M,buttonBoxShadowFocus:O,buttonBoxShadowHover:ue,buttonColor:ce,buttonColorActive:be,buttonTextColor:he,buttonTextColorActive:ve,buttonTextColorHover:pe,opacityDisabled:fe,[T("buttonHeight",h)]:me,[T("fontSize",h)]:ge}}=p.value;return{"--n-font-size":ge,"--n-bezier":f,"--n-button-border-color":z,"--n-button-border-color-active":A,"--n-button-border-radius":N,"--n-button-box-shadow":M,"--n-button-box-shadow-focus":O,"--n-button-box-shadow-hover":ue,"--n-button-color":ce,"--n-button-color-active":be,"--n-button-text-color":he,"--n-button-text-color-hover":pe,"--n-button-text-color-active":ve,"--n-height":me,"--n-opacity-disabled":fe}}),b=x?le("radio-group",P(()=>a.value[0]),V,r):void 0;return{selfElRef:o,rtlEnabled:F,mergedClsPrefix:u,mergedValue:e,handleFocusout:c,handleFocusin:t,cssVars:x?void 0:V,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender}},render(){var r;const{mergedValue:o,mergedClsPrefix:a,handleFocusin:s,handleFocusout:l}=this,{children:g,isButtonGroup:d}=Qe(De(Pe(this)),o,a);return(r=this.onRender)===null||r===void 0||r.call(this),I("div",{onFocusin:s,onFocusout:l,ref:"selfElRef",class:[`${a}-radio-group`,this.rtlEnabled&&`${a}-radio-group--rtl`,this.themeClass,d&&`${a}-radio-group--button-group`],style:this.cssVars},g)}}),Xe={class:"settings-view"},Ye={key:0,class:"feedback error",role:"alert"},Ze={key:1,class:"loading-panel",role:"status"},eo={key:2,class:"empty-panel"},oo=["onSubmit"],to={class:"panel-heading"},ao={class:"setting-copy"},ro=["id"],no=["id"],io={class:"radio-options"},lo={class:"radio-copy"},so={key:0},uo={key:0,class:"feedback error",role:"alert"},co={key:1,class:"feedback success",role:"status"},bo=J({__name:"SettingsView",setup(r){const o=ze(),a=we({}),s=U(""),l=$e({queryKey:["settings","schema"],queryFn:()=>oe.get("/setting/schema")}),g=P(()=>{var n;return((n=l.data.value)==null?void 0:n.apps)??[]});_e(g,n=>{Object.keys(a).forEach(i=>delete a[i]),n.forEach(i=>{a[i.app_name]=Object.fromEntries(i.settings.map(e=>[e.key,e.value]))})},{immediate:!0});const d=Be({mutationFn:n=>oe.post("/setting",{app_name:n.app_name,settings:{...a[n.app_name]}}),onMutate:()=>{s.value=""},onSuccess:async(n,i)=>{s.value=i.app_name,await o.invalidateQueries({queryKey:["settings","schema"]})}});function v(n,i){var e;return((e=a[n])==null?void 0:e[i.key])??i.default}function u(n,i,e){e!==null&&a[n]&&(a[n][i]=e)}function x(n,i){const e=v(n,i);return typeof e=="boolean"?String(Number(e)):e}function w(n){var i;return d.isPending.value&&((i=d.variables.value)==null?void 0:i.app_name)===n}function p(n,i){return`setting-${n}-${i}`}return(n,i)=>(m(),R("div",Xe,[Y(Ve,{title:"团队设置",description:"配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。"}),y(l).isError.value?(m(),R("p",Ye,C(y(Z)(y(l).error.value)),1)):y(l).isPending.value?(m(),R("div",Ze,"正在加载团队设置…")):g.value.length?(m(!0),R(L,{key:3},G(g.value,e=>{var S;return m(),R("form",{key:e.app_name,class:"settings-panel",onSubmit:ke(t=>y(d).mutate(e),["prevent"])},[_("header",to,[_("div",null,[_("p",null,C(e.app_name.toUpperCase()),1),_("h2",null,C(e.label),1),_("span",null,C(e.description),1)]),Y(Re,{type:"submit",loading:w(e.app_name),disabled:y(d).isPending.value},{default:K(()=>[Ce(" 保存"+C(e.label)+"设置 ",1)]),_:2},1032,["loading","disabled"])]),(m(!0),R(L,null,G(e.settings,t=>(m(),R("section",{key:t.key,class:ee(["setting-row",{"setting-row--choices":t.control==="radio"}])},[_("div",ao,[_("h3",{id:`${p(e.app_name,t.key)}-label`},C(t.label),9,ro),_("p",{id:`${p(e.app_name,t.key)}-description`},C(t.description),9,no),_("code",null,C(e.app_name)+"."+C(t.key),1)]),_("div",{class:ee(["setting-control",{"setting-control--choices":t.control==="radio"}])},[t.control==="switch"?(m(),E(y(Ae),{key:0,value:!!v(e.app_name,t),"aria-labelledby":`${p(e.app_name,t.key)}-label`,"aria-describedby":`${p(e.app_name,t.key)}-description`,"onUpdate:value":c=>u(e.app_name,t.key,c)},null,8,["value","aria-labelledby","aria-describedby","onUpdate:value"])):t.control==="radio"?(m(),E(y(Je),{key:1,value:x(e.app_name,t),"aria-labelledby":`${p(e.app_name,t.key)}-label`,"aria-describedby":`${p(e.app_name,t.key)}-description`,"onUpdate:value":c=>u(e.app_name,t.key,c)},{default:K(()=>[_("div",io,[(m(!0),R(L,null,G(t.options??[],c=>(m(),E(y(Ke),{key:String(c.value),value:c.value},{default:K(()=>[_("span",lo,[_("strong",null,C(c.label),1),c.description?(m(),R("small",so,C(c.description),1)):q("",!0)])]),_:2},1032,["value"]))),128))])]),_:2},1032,["value","aria-labelledby","aria-describedby","onUpdate:value"])):t.control==="select"?(m(),E(y(Ne),{key:2,value:x(e.app_name,t),options:t.options??[],"aria-label":t.label,"aria-describedby":`${p(e.app_name,t.key)}-description`,"onUpdate:value":c=>u(e.app_name,t.key,c)},null,8,["value","options","aria-label","aria-describedby","onUpdate:value"])):t.control==="number"?(m(),E(y(Ee),{key:3,value:Number(v(e.app_name,t)),min:t.min,max:t.max,step:t.step,"input-props":{"aria-label":t.label,"aria-describedby":`${p(e.app_name,t.key)}-description`},"onUpdate:value":c=>u(e.app_name,t.key,c)},null,8,["value","min","max","step","input-props","onUpdate:value"])):(m(),E(y(He),{key:4,value:String(v(e.app_name,t)),maxlength:t.max_length,"input-props":{"aria-label":t.label,"aria-describedby":`${p(e.app_name,t.key)}-description`},"onUpdate:value":c=>u(e.app_name,t.key,c)},null,8,["value","maxlength","input-props","onUpdate:value"]))],2)],2))),128)),y(d).isError.value&&((S=y(d).variables.value)==null?void 0:S.app_name)===e.app_name?(m(),R("p",uo,C(y(Z)(y(d).error.value)),1)):q("",!0),s.value===e.app_name?(m(),R("p",co,C(e.label)+"设置已保存。 ",1)):q("",!0)],40,oo)}),128)):(m(),R("div",eo,[...i[0]||(i[0]=[_("h2",null,"当前没有可配置项",-1),_("p",null,"应用登记团队设置后会自动显示在这里。",-1)])]))]))}}),Ho=Se(bo,[["__scopeId","data-v-898ffe7d"]]);export{Ho as default};
