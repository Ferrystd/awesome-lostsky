import{av as xe,b2 as Z,aw as U,ax as $,ay as k,az as B,aB as Q,aQ as ye,aC as J,b3 as re,E as D,aP as X,aG as _e,aL as W,aI as A,d as Y,P as I,aW as ke,aD as j,aE as ne,aF as ie,k as H,aZ as T,b4 as Ce,aH as we,C as Se,u as Re,K as ze,a as R,f as ee,e as y,t as C,y as oe,b as _,F as O,j as G,J as $e,L as Be,w as K,g as Fe,a5 as ae,h as P,o as m,i as q,n as te,_ as Ve}from"./index-49TE631d.js";import{L as Ie}from"./LsButton-DuiJBdN2.js";import{u as Ue}from"./useMutation-Cm2Xer7B.js";import{A as De}from"./AdminPageHeader-3qpysEvX.js";import{u as le}from"./use-locale-C3i-A2IO.js";import{N as Ee}from"./Switch-Bo7NaO17.js";import{N as Ne}from"./Select-CO8TJCeg.js";import{N as Pe}from"./InputNumber-Db4beLiK.js";import{N as Ae}from"./Input-DRP9PHLg.js";import"./arrow-left-9kWhiLjI.js";import"./Suffix-B5z1o2Iu.js";import"./Tag-BdUeqpHF.js";import"./get-CPYLe2Jo.js";import"./happens-in-CM8LO42l.js";function He(r,o="default",t=[]){const l=r.$slots[o];return l===void 0?t:l()}const Te={radioSizeSmall:"14px",radioSizeMedium:"16px",radioSizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function je(r){const{borderColor:o,primaryColor:t,baseColor:s,textColorDisabled:l,inputColorDisabled:g,textColor2:d,opacityDisabled:v,borderRadius:u,fontSizeSmall:x,fontSizeMedium:w,fontSizeLarge:p,heightSmall:n,heightMedium:i,heightLarge:e,lineHeight:S}=r;return Object.assign(Object.assign({},Te),{labelLineHeight:S,buttonHeightSmall:n,buttonHeightMedium:i,buttonHeightLarge:e,fontSizeSmall:x,fontSizeMedium:w,fontSizeLarge:p,boxShadow:`inset 0 0 0 1px ${o}`,boxShadowActive:`inset 0 0 0 1px ${t}`,boxShadowFocus:`inset 0 0 0 1px ${t}, 0 0 0 2px ${Z(t,{alpha:.2})}`,boxShadowHover:`inset 0 0 0 1px ${t}`,boxShadowDisabled:`inset 0 0 0 1px ${o}`,color:s,colorDisabled:g,colorActive:"#0000",textColor:d,textColorDisabled:l,dotColorActive:t,dotColorDisabled:o,buttonBorderColor:o,buttonBorderColorActive:t,buttonBorderColorHover:o,buttonColor:s,buttonColorActive:s,buttonTextColor:d,buttonTextColorActive:t,buttonTextColorHover:t,opacityDisabled:v,buttonBoxShadowFocus:`inset 0 0 0 1px ${t}, 0 0 0 2px ${Z(t,{alpha:.3})}`,buttonBoxShadowHover:"inset 0 0 0 1px #0000",buttonBoxShadow:"inset 0 0 0 1px #0000",buttonBorderRadius:u})}const se={common:xe,self:je},Le=U("radio",`
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
 `),U("radio-input",`
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
 `),Q("disabled",`
 cursor: pointer;
 `,[B("&:hover",[k("dot",{boxShadow:"var(--n-box-shadow-hover)"})]),$("focus",[B("&:not(:active)",[k("dot",{boxShadow:"var(--n-box-shadow-focus)"})])])]),$("disabled",`
 cursor: not-allowed;
 `,[k("dot",{boxShadow:"var(--n-box-shadow-disabled)",backgroundColor:"var(--n-color-disabled)"},[B("&::before",{backgroundColor:"var(--n-dot-color-disabled)"}),$("checked",`
 opacity: 1;
 `)]),k("label",{color:"var(--n-text-color-disabled)"}),U("radio-input",`
 cursor: not-allowed;
 `)])]),Me={name:String,value:{type:[String,Number,Boolean],default:"on"},checked:{type:Boolean,default:void 0},defaultChecked:Boolean,disabled:{type:Boolean,default:void 0},label:String,size:String,onUpdateChecked:[Function,Array],"onUpdate:checked":[Function,Array],checkedValue:{type:Boolean,default:void 0}},de=_e("n-radio-group");function Oe(r){const o=ye(de,null),{mergedClsPrefixRef:t,mergedComponentPropsRef:s}=J(r),l=re(r,{mergedSize(b){var h,f;const{size:z}=r;if(z!==void 0)return z;if(o){const{mergedSizeRef:{value:N}}=o;if(N!==void 0)return N}if(b)return b.mergedSize.value;const E=(f=(h=s==null?void 0:s.value)===null||h===void 0?void 0:h.Radio)===null||f===void 0?void 0:f.size;return E||"medium"},mergedDisabled(b){return!!(r.disabled||o!=null&&o.disabledRef.value||b!=null&&b.disabled.value)}}),{mergedSizeRef:g,mergedDisabledRef:d}=l,v=D(null),u=D(null),x=D(r.defaultChecked),w=W(r,"checked"),p=le(w,x),n=X(()=>o?o.valueRef.value===r.value:p.value),i=X(()=>{const{name:b}=r;if(b!==void 0)return b;if(o)return o.nameRef.value}),e=D(!1);function S(){if(o){const{doUpdateValue:b}=o,{value:h}=r;A(b,h)}else{const{onUpdateChecked:b,"onUpdate:checked":h}=r,{nTriggerFormInput:f,nTriggerFormChange:z}=l;b&&A(b,!0),h&&A(h,!0),f(),z(),x.value=!0}}function a(){d.value||n.value||S()}function c(){a(),v.value&&(v.value.checked=n.value)}function V(){e.value=!1}function F(){e.value=!0}return{mergedClsPrefix:o?o.mergedClsPrefixRef:t,inputRef:v,labelRef:u,mergedName:i,mergedDisabled:d,renderSafeChecked:n,focus:e,mergedSize:g,handleRadioInputChange:c,handleRadioInputBlur:V,handleRadioInputFocus:F}}const Ge=Object.assign(Object.assign({},j.props),Me),Ke=Y({name:"Radio",props:Ge,setup(r){const o=Oe(r),t=j("Radio","-radio",Le,se,r,o.mergedClsPrefix),s=H(()=>{const{mergedSize:{value:x}}=o,{common:{cubicBezierEaseInOut:w},self:{boxShadow:p,boxShadowActive:n,boxShadowDisabled:i,boxShadowFocus:e,boxShadowHover:S,color:a,colorDisabled:c,colorActive:V,textColor:F,textColorDisabled:b,dotColorActive:h,dotColorDisabled:f,labelPadding:z,labelLineHeight:E,labelFontWeight:N,[T("fontSize",x)]:L,[T("radioSize",x)]:M}}=t.value;return{"--n-bezier":w,"--n-label-line-height":E,"--n-label-font-weight":N,"--n-box-shadow":p,"--n-box-shadow-active":n,"--n-box-shadow-disabled":i,"--n-box-shadow-focus":e,"--n-box-shadow-hover":S,"--n-color":a,"--n-color-active":V,"--n-color-disabled":c,"--n-dot-color-active":h,"--n-dot-color-disabled":f,"--n-font-size":L,"--n-radio-size":M,"--n-text-color":F,"--n-text-color-disabled":b,"--n-label-padding":z}}),{inlineThemeDisabled:l,mergedClsPrefixRef:g,mergedRtlRef:d}=J(r),v=ne("Radio",d,g),u=l?ie("radio",H(()=>o.mergedSize.value[0]),s,r):void 0;return Object.assign(o,{rtlEnabled:v,cssVars:l?void 0:s,themeClass:u==null?void 0:u.themeClass,onRender:u==null?void 0:u.onRender})},render(){const{$slots:r,mergedClsPrefix:o,onRender:t,label:s}=this;return t==null||t(),I("label",{class:[`${o}-radio`,this.themeClass,this.rtlEnabled&&`${o}-radio--rtl`,this.mergedDisabled&&`${o}-radio--disabled`,this.renderSafeChecked&&`${o}-radio--checked`,this.focus&&`${o}-radio--focus`],style:this.cssVars},I("div",{class:`${o}-radio__dot-wrapper`}," ",I("div",{class:[`${o}-radio__dot`,this.renderSafeChecked&&`${o}-radio__dot--checked`]}),I("input",{ref:"inputRef",type:"radio",class:`${o}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur})),ke(r.default,l=>!l&&!s?null:I("div",{ref:"labelRef",class:`${o}-radio__label`},l||s)))}}),qe=U("radio-group",`
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
 `,[U("radio-button",{height:"var(--n-height)",lineHeight:"var(--n-height)"}),k("splitor",{height:"var(--n-height)"})]),U("radio-button",`
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
 `,[U("radio-input",`
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
 `)]),Q("disabled",`
 cursor: pointer;
 `,[B("&:hover",[k("state-border",`
 transition: box-shadow .3s var(--n-bezier);
 box-shadow: var(--n-button-box-shadow-hover);
 `),Q("checked",{color:"var(--n-button-text-color-hover)"})]),$("focus",[B("&:not(:active)",[k("state-border",{boxShadow:"var(--n-button-box-shadow-focus)"})])])]),$("checked",`
 background: var(--n-button-color-active);
 color: var(--n-button-text-color-active);
 border-color: var(--n-button-border-color-active);
 `),$("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `)])]);function Qe(r,o,t){var s;const l=[];let g=!1;for(let d=0;d<r.length;++d){const v=r[d],u=(s=v.type)===null||s===void 0?void 0:s.name;u==="RadioButton"&&(g=!0);const x=v.props;if(u!=="RadioButton"){l.push(v);continue}if(d===0)l.push(v);else{const w=l[l.length-1].props,p=o===w.value,n=w.disabled,i=o===x.value,e=x.disabled,S=(p?2:0)+(n?0:1),a=(i?2:0)+(e?0:1),c={[`${t}-radio-group__splitor--disabled`]:n,[`${t}-radio-group__splitor--checked`]:p},V={[`${t}-radio-group__splitor--disabled`]:e,[`${t}-radio-group__splitor--checked`]:i},F=S<a?V:c;l.push(I("div",{class:[`${t}-radio-group__splitor`,F]}),v)}}return{children:l,isButtonGroup:g}}const We=Object.assign(Object.assign({},j.props),{name:String,value:[String,Number,Boolean],defaultValue:{type:[String,Number,Boolean],default:null},size:String,disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),Je=Y({name:"RadioGroup",props:We,setup(r){const o=D(null),{mergedSizeRef:t,mergedDisabledRef:s,nTriggerFormChange:l,nTriggerFormInput:g,nTriggerFormBlur:d,nTriggerFormFocus:v}=re(r),{mergedClsPrefixRef:u,inlineThemeDisabled:x,mergedRtlRef:w}=J(r),p=j("Radio","-radio-group",qe,se,r,u),n=D(r.defaultValue),i=W(r,"value"),e=le(i,n);function S(h){const{onUpdateValue:f,"onUpdate:value":z}=r;f&&A(f,h),z&&A(z,h),n.value=h,l(),g()}function a(h){const{value:f}=o;f&&(f.contains(h.relatedTarget)||v())}function c(h){const{value:f}=o;f&&(f.contains(h.relatedTarget)||d())}we(de,{mergedClsPrefixRef:u,nameRef:W(r,"name"),valueRef:e,disabledRef:s,mergedSizeRef:t,doUpdateValue:S});const V=ne("Radio",w,u),F=H(()=>{const{value:h}=t,{common:{cubicBezierEaseInOut:f},self:{buttonBorderColor:z,buttonBorderColorActive:E,buttonBorderRadius:N,buttonBoxShadow:L,buttonBoxShadowFocus:M,buttonBoxShadowHover:ue,buttonColor:ce,buttonColorActive:be,buttonTextColor:he,buttonTextColorActive:ve,buttonTextColorHover:pe,opacityDisabled:fe,[T("buttonHeight",h)]:me,[T("fontSize",h)]:ge}}=p.value;return{"--n-font-size":ge,"--n-bezier":f,"--n-button-border-color":z,"--n-button-border-color-active":E,"--n-button-border-radius":N,"--n-button-box-shadow":L,"--n-button-box-shadow-focus":M,"--n-button-box-shadow-hover":ue,"--n-button-color":ce,"--n-button-color-active":be,"--n-button-text-color":he,"--n-button-text-color-hover":pe,"--n-button-text-color-active":ve,"--n-height":me,"--n-opacity-disabled":fe}}),b=x?ie("radio-group",H(()=>t.value[0]),F,r):void 0;return{selfElRef:o,rtlEnabled:V,mergedClsPrefix:u,mergedValue:e,handleFocusout:c,handleFocusin:a,cssVars:x?void 0:F,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender}},render(){var r;const{mergedValue:o,mergedClsPrefix:t,handleFocusin:s,handleFocusout:l}=this,{children:g,isButtonGroup:d}=Qe(Ce(He(this)),o,t);return(r=this.onRender)===null||r===void 0||r.call(this),I("div",{onFocusin:s,onFocusout:l,ref:"selfElRef",class:[`${t}-radio-group`,this.rtlEnabled&&`${t}-radio-group--rtl`,this.themeClass,d&&`${t}-radio-group--button-group`],style:this.cssVars},g)}}),Ye={class:"settings-view"},Ze={key:0,class:"feedback error",role:"alert"},Xe={key:1,class:"loading-panel",role:"status"},eo={key:2,class:"empty-panel"},oo=["onSubmit"],ao={class:"panel-heading"},to={class:"setting-copy"},ro=["id"],no=["id"],io={class:"radio-options"},lo={class:"radio-copy"},so={key:0},uo={key:0,class:"feedback error",role:"alert"},co={key:1,class:"feedback success",role:"status"},bo=Y({__name:"SettingsView",setup(r){const o=Se(),t=$e({}),s=D(""),l=Re({queryKey:["settings","schema"],queryFn:()=>te.get("/setting/schema")}),g=H(()=>{var n;return((n=l.data.value)==null?void 0:n.apps)??[]});ze(g,n=>{Object.keys(t).forEach(i=>delete t[i]),n.forEach(i=>{t[i.app_name]=Object.fromEntries(i.settings.map(e=>[e.key,e.value]))})},{immediate:!0});const d=Ue({mutationFn:n=>te.post("/setting",{app_name:n.app_name,settings:{...t[n.app_name]}}),onMutate:()=>{s.value=""},onSuccess:async(n,i)=>{s.value=i.app_name,await o.invalidateQueries({queryKey:["settings","schema"]})}});function v(n,i){var e;return((e=t[n])==null?void 0:e[i.key])??i.default}function u(n,i,e){e!==null&&t[n]&&(t[n][i]=e)}function x(n,i){const e=v(n,i);return typeof e=="boolean"?String(Number(e)):e}function w(n){var i;return d.isPending.value&&((i=d.variables.value)==null?void 0:i.app_name)===n}function p(n,i){return`setting-${n}-${i}`}return(n,i)=>(m(),R("div",Ye,[ee(De,{title:"团队设置",description:"配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。"}),y(l).isError.value?(m(),R("p",Ze,C(y(oe)(y(l).error.value)),1)):y(l).isPending.value?(m(),R("div",Xe,"正在加载团队设置…")):g.value.length?(m(!0),R(O,{key:3},G(g.value,e=>{var S;return m(),R("form",{key:e.app_name,class:"settings-panel",onSubmit:Be(a=>y(d).mutate(e),["prevent"])},[_("header",ao,[_("div",null,[_("p",null,C(e.app_name.toUpperCase()),1),_("h2",null,C(e.label),1),_("span",null,C(e.description),1)]),ee(Ie,{type:"submit",loading:w(e.app_name),disabled:y(d).isPending.value},{default:K(()=>[Fe(" 保存"+C(e.label)+"设置 ",1)]),_:2},1032,["loading","disabled"])]),(m(!0),R(O,null,G(e.settings,a=>(m(),R("section",{key:a.key,class:ae(["setting-row",{"setting-row--choices":a.control==="radio"}])},[_("div",to,[_("h3",{id:`${p(e.app_name,a.key)}-label`},C(a.label),9,ro),_("p",{id:`${p(e.app_name,a.key)}-description`},C(a.description),9,no),_("code",null,C(e.app_name)+"."+C(a.key),1)]),_("div",{class:ae(["setting-control",{"setting-control--choices":a.control==="radio"}])},[a.control==="switch"?(m(),P(y(Ee),{key:0,value:!!v(e.app_name,a),"aria-labelledby":`${p(e.app_name,a.key)}-label`,"aria-describedby":`${p(e.app_name,a.key)}-description`,"onUpdate:value":c=>u(e.app_name,a.key,c)},null,8,["value","aria-labelledby","aria-describedby","onUpdate:value"])):a.control==="radio"?(m(),P(y(Je),{key:1,value:x(e.app_name,a),"aria-labelledby":`${p(e.app_name,a.key)}-label`,"aria-describedby":`${p(e.app_name,a.key)}-description`,"onUpdate:value":c=>u(e.app_name,a.key,c)},{default:K(()=>[_("div",io,[(m(!0),R(O,null,G(a.options??[],c=>(m(),P(y(Ke),{key:String(c.value),value:c.value},{default:K(()=>[_("span",lo,[_("strong",null,C(c.label),1),c.description?(m(),R("small",so,C(c.description),1)):q("",!0)])]),_:2},1032,["value"]))),128))])]),_:2},1032,["value","aria-labelledby","aria-describedby","onUpdate:value"])):a.control==="select"?(m(),P(y(Ne),{key:2,value:x(e.app_name,a),options:a.options??[],"aria-label":a.label,"aria-describedby":`${p(e.app_name,a.key)}-description`,"onUpdate:value":c=>u(e.app_name,a.key,c)},null,8,["value","options","aria-label","aria-describedby","onUpdate:value"])):a.control==="number"?(m(),P(y(Pe),{key:3,value:Number(v(e.app_name,a)),min:a.min,max:a.max,step:a.step,"input-props":{"aria-label":a.label,"aria-describedby":`${p(e.app_name,a.key)}-description`},"onUpdate:value":c=>u(e.app_name,a.key,c)},null,8,["value","min","max","step","input-props","onUpdate:value"])):(m(),P(y(Ae),{key:4,value:String(v(e.app_name,a)),maxlength:a.max_length,"input-props":{"aria-label":a.label,"aria-describedby":`${p(e.app_name,a.key)}-description`},"onUpdate:value":c=>u(e.app_name,a.key,c)},null,8,["value","maxlength","input-props","onUpdate:value"]))],2)],2))),128)),y(d).isError.value&&((S=y(d).variables.value)==null?void 0:S.app_name)===e.app_name?(m(),R("p",uo,C(y(oe)(y(d).error.value)),1)):q("",!0),s.value===e.app_name?(m(),R("p",co,C(e.label)+"设置已保存。 ",1)):q("",!0)],40,oo)}),128)):(m(),R("div",eo,[...i[0]||(i[0]=[_("h2",null,"当前没有可配置项",-1),_("p",null,"应用登记团队设置后会自动显示在这里。",-1)])]))]))}}),zo=Ve(bo,[["__scopeId","data-v-898ffe7d"]]);export{zo as default};
