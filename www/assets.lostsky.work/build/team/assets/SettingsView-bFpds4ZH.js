import{a2 as ge,H as U,a4 as Q,g as J,X as I,d as T,a6 as xe,w as ke,j as S,l as Y,u as k,t as C,k as y,F as L,x as G,i as f,q as Z,K as _e,m as q,p as ye,a5 as Ce,y as E,v as K,J as we,A as ee,_ as Se}from"./index-BvpFVGT5.js";import{L as Re}from"./LsButton-BvHQPyYc.js";import{u as ze}from"./useQueryClient-D3qgpF2c.js";import{u as Be}from"./useQuery-HdUHA7D7.js";import{u as $e}from"./useMutation-BbIJRkUx.js";import{A as Ve}from"./AdminPageHeader-Bv11D_dX.js";import{N as Fe}from"./Switch-DFAiooCk.js";import{d as Ie,O as oe,b as D,f as z,g as _,c as B,P as W,u as X,Q as ae,R as re,T as te,v as Ue,q as P,k as De,m as j,n as ne,p as ie,s as H}from"./browser-LtPhahJk.js";import{n as Ae}from"./Tag-YWbDluNN.js";import{N as Ne}from"./Select-ADOl3OYx.js";import{N as Ee}from"./InputNumber-DSCA4qg6.js";import{N as Pe}from"./Input-CfADA9yW.js";import"./queryObserver-DXZLgHvS.js";import"./arrow-left-BaXPvBvr.js";import"./index-BJKaMiZy.js";import"./Button-BhibJKc7.js";import"./format-length-D7YqQSD2.js";function Te(r,e="default",t=[]){const i=r.$slots[e];return i===void 0?t:i()}const He={radioSizeSmall:"14px",radioSizeMedium:"16px",radioSizeLarge:"18px",labelPadding:"0 8px",labelFontWeight:"400"};function je(r){const{borderColor:e,primaryColor:t,baseColor:s,textColorDisabled:i,inputColorDisabled:m,textColor2:d,opacityDisabled:h,borderRadius:u,fontSizeSmall:g,fontSizeMedium:w,fontSizeLarge:l,heightSmall:n,heightMedium:o,heightLarge:x,lineHeight:a}=r;return Object.assign(Object.assign({},He),{labelLineHeight:a,buttonHeightSmall:n,buttonHeightMedium:o,buttonHeightLarge:x,fontSizeSmall:g,fontSizeMedium:w,fontSizeLarge:l,boxShadow:`inset 0 0 0 1px ${e}`,boxShadowActive:`inset 0 0 0 1px ${t}`,boxShadowFocus:`inset 0 0 0 1px ${t}, 0 0 0 2px ${oe(t,{alpha:.2})}`,boxShadowHover:`inset 0 0 0 1px ${t}`,boxShadowDisabled:`inset 0 0 0 1px ${e}`,color:s,colorDisabled:m,colorActive:"#0000",textColor:d,textColorDisabled:i,dotColorActive:t,dotColorDisabled:e,buttonBorderColor:e,buttonBorderColorActive:t,buttonBorderColorHover:e,buttonColor:s,buttonColorActive:s,buttonTextColor:d,buttonTextColorActive:t,buttonTextColorHover:t,opacityDisabled:h,buttonBoxShadowFocus:`inset 0 0 0 1px ${t}, 0 0 0 2px ${oe(t,{alpha:.3})}`,buttonBoxShadowHover:"inset 0 0 0 1px #0000",buttonBoxShadow:"inset 0 0 0 1px #0000",buttonBorderRadius:u})}const le={common:Ie,self:je},Oe=D("radio",`
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
`,[z("checked",[_("dot",`
 background-color: var(--n-color-active);
 `)]),_("dot-wrapper",`
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
 `),_("dot",`
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
 `),z("checked",{boxShadow:"var(--n-box-shadow-active)"},[B("&::before",`
 opacity: 1;
 transform: scale(1);
 `)])]),_("label",`
 color: var(--n-text-color);
 padding: var(--n-label-padding);
 font-weight: var(--n-label-font-weight);
 display: inline-block;
 transition: color .3s var(--n-bezier);
 `),W("disabled",`
 cursor: pointer;
 `,[B("&:hover",[_("dot",{boxShadow:"var(--n-box-shadow-hover)"})]),z("focus",[B("&:not(:active)",[_("dot",{boxShadow:"var(--n-box-shadow-focus)"})])])]),z("disabled",`
 cursor: not-allowed;
 `,[_("dot",{boxShadow:"var(--n-box-shadow-disabled)",backgroundColor:"var(--n-color-disabled)"},[B("&::before",{backgroundColor:"var(--n-dot-color-disabled)"}),z("checked",`
 opacity: 1;
 `)]),_("label",{color:"var(--n-text-color-disabled)"}),D("radio-input",`
 cursor: not-allowed;
 `)])]),Me={name:String,value:{type:[String,Number,Boolean],default:"on"},checked:{type:Boolean,default:void 0},defaultChecked:Boolean,disabled:{type:Boolean,default:void 0},label:String,size:String,onUpdateChecked:[Function,Array],"onUpdate:checked":[Function,Array],checkedValue:{type:Boolean,default:void 0}},se=Ue("n-radio-group");function Le(r){const e=ge(se,null),{mergedClsPrefixRef:t,mergedComponentPropsRef:s}=X(r),i=ae(r,{mergedSize(b){var v,p;const{size:R}=r;if(R!==void 0)return R;if(e){const{mergedSizeRef:{value:N}}=e;if(N!==void 0)return N}if(b)return b.mergedSize.value;const A=(p=(v=s==null?void 0:s.value)===null||v===void 0?void 0:v.Radio)===null||p===void 0?void 0:p.size;return A||"medium"},mergedDisabled(b){return!!(r.disabled||e!=null&&e.disabledRef.value||b!=null&&b.disabled.value)}}),{mergedSizeRef:m,mergedDisabledRef:d}=i,h=U(null),u=U(null),g=U(r.defaultChecked),w=Q(r,"checked"),l=re(w,g),n=te(()=>e?e.valueRef.value===r.value:l.value),o=te(()=>{const{name:b}=r;if(b!==void 0)return b;if(e)return e.nameRef.value}),x=U(!1);function a(){if(e){const{doUpdateValue:b}=e,{value:v}=r;P(b,v)}else{const{onUpdateChecked:b,"onUpdate:checked":v}=r,{nTriggerFormInput:p,nTriggerFormChange:R}=i;b&&P(b,!0),v&&P(v,!0),p(),R(),g.value=!0}}function c(){d.value||n.value||a()}function V(){c(),h.value&&(h.value.checked=n.value)}function F(){x.value=!1}function $(){x.value=!0}return{mergedClsPrefix:e?e.mergedClsPrefixRef:t,inputRef:h,labelRef:u,mergedName:o,mergedDisabled:d,renderSafeChecked:n,focus:x,mergedSize:m,handleRadioInputChange:V,handleRadioInputBlur:F,handleRadioInputFocus:$}}const Ge=Object.assign(Object.assign({},j.props),Me),qe=J({name:"Radio",props:Ge,setup(r){const e=Le(r),t=j("Radio","-radio",Oe,le,r,e.mergedClsPrefix),s=T(()=>{const{mergedSize:{value:g}}=e,{common:{cubicBezierEaseInOut:w},self:{boxShadow:l,boxShadowActive:n,boxShadowDisabled:o,boxShadowFocus:x,boxShadowHover:a,color:c,colorDisabled:V,colorActive:F,textColor:$,textColorDisabled:b,dotColorActive:v,dotColorDisabled:p,labelPadding:R,labelLineHeight:A,labelFontWeight:N,[H("fontSize",g)]:O,[H("radioSize",g)]:M}}=t.value;return{"--n-bezier":w,"--n-label-line-height":A,"--n-label-font-weight":N,"--n-box-shadow":l,"--n-box-shadow-active":n,"--n-box-shadow-disabled":o,"--n-box-shadow-focus":x,"--n-box-shadow-hover":a,"--n-color":c,"--n-color-active":F,"--n-color-disabled":V,"--n-dot-color-active":v,"--n-dot-color-disabled":p,"--n-font-size":O,"--n-radio-size":M,"--n-text-color":$,"--n-text-color-disabled":b,"--n-label-padding":R}}),{inlineThemeDisabled:i,mergedClsPrefixRef:m,mergedRtlRef:d}=X(r),h=ne("Radio",d,m),u=i?ie("radio",T(()=>e.mergedSize.value[0]),s,r):void 0;return Object.assign(e,{rtlEnabled:h,cssVars:i?void 0:s,themeClass:u==null?void 0:u.themeClass,onRender:u==null?void 0:u.onRender})},render(){const{$slots:r,mergedClsPrefix:e,onRender:t,label:s}=this;return t==null||t(),I("label",{class:[`${e}-radio`,this.themeClass,this.rtlEnabled&&`${e}-radio--rtl`,this.mergedDisabled&&`${e}-radio--disabled`,this.renderSafeChecked&&`${e}-radio--checked`,this.focus&&`${e}-radio--focus`],style:this.cssVars},I("div",{class:`${e}-radio__dot-wrapper`}," ",I("div",{class:[`${e}-radio__dot`,this.renderSafeChecked&&`${e}-radio__dot--checked`]}),I("input",{ref:"inputRef",type:"radio",class:`${e}-radio-input`,value:this.value,name:this.mergedName,checked:this.renderSafeChecked,disabled:this.mergedDisabled,onChange:this.handleRadioInputChange,onFocus:this.handleRadioInputFocus,onBlur:this.handleRadioInputBlur})),De(r.default,i=>!i&&!s?null:I("div",{ref:"labelRef",class:`${e}-radio__label`},i||s)))}}),Ke=D("radio-group",`
 display: inline-block;
 font-size: var(--n-font-size);
`,[_("splitor",`
 display: inline-block;
 vertical-align: bottom;
 width: 1px;
 transition:
 background-color .3s var(--n-bezier),
 opacity .3s var(--n-bezier);
 background: var(--n-button-border-color);
 `,[z("checked",{backgroundColor:"var(--n-button-border-color-active)"}),z("disabled",{opacity:"var(--n-opacity-disabled)"})]),z("button-group",`
 white-space: nowrap;
 height: var(--n-height);
 line-height: var(--n-height);
 `,[D("radio-button",{height:"var(--n-height)",lineHeight:"var(--n-height)"}),_("splitor",{height:"var(--n-height)"})]),D("radio-button",`
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
 `),_("state-border",`
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
 `,[_("state-border",`
 border-top-left-radius: var(--n-button-border-radius);
 border-bottom-left-radius: var(--n-button-border-radius);
 `)]),B("&:last-child",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 border-right: 1px solid var(--n-button-border-color);
 `,[_("state-border",`
 border-top-right-radius: var(--n-button-border-radius);
 border-bottom-right-radius: var(--n-button-border-radius);
 `)]),W("disabled",`
 cursor: pointer;
 `,[B("&:hover",[_("state-border",`
 transition: box-shadow .3s var(--n-bezier);
 box-shadow: var(--n-button-box-shadow-hover);
 `),W("checked",{color:"var(--n-button-text-color-hover)"})]),z("focus",[B("&:not(:active)",[_("state-border",{boxShadow:"var(--n-button-box-shadow-focus)"})])])]),z("checked",`
 background: var(--n-button-color-active);
 color: var(--n-button-text-color-active);
 border-color: var(--n-button-border-color-active);
 `),z("disabled",`
 cursor: not-allowed;
 opacity: var(--n-opacity-disabled);
 `)])]);function Qe(r,e,t){var s;const i=[];let m=!1;for(let d=0;d<r.length;++d){const h=r[d],u=(s=h.type)===null||s===void 0?void 0:s.name;u==="RadioButton"&&(m=!0);const g=h.props;if(u!=="RadioButton"){i.push(h);continue}if(d===0)i.push(h);else{const w=i[i.length-1].props,l=e===w.value,n=w.disabled,o=e===g.value,x=g.disabled,a=(l?2:0)+(n?0:1),c=(o?2:0)+(x?0:1),V={[`${t}-radio-group__splitor--disabled`]:n,[`${t}-radio-group__splitor--checked`]:l},F={[`${t}-radio-group__splitor--disabled`]:x,[`${t}-radio-group__splitor--checked`]:o},$=a<c?F:V;i.push(I("div",{class:[`${t}-radio-group__splitor`,$]}),h)}}return{children:i,isButtonGroup:m}}const We=Object.assign(Object.assign({},j.props),{name:String,value:[String,Number,Boolean],defaultValue:{type:[String,Number,Boolean],default:null},size:String,disabled:{type:Boolean,default:void 0},"onUpdate:value":[Function,Array],onUpdateValue:[Function,Array]}),Je=J({name:"RadioGroup",props:We,setup(r){const e=U(null),{mergedSizeRef:t,mergedDisabledRef:s,nTriggerFormChange:i,nTriggerFormInput:m,nTriggerFormBlur:d,nTriggerFormFocus:h}=ae(r),{mergedClsPrefixRef:u,inlineThemeDisabled:g,mergedRtlRef:w}=X(r),l=j("Radio","-radio-group",Ke,le,r,u),n=U(r.defaultValue),o=Q(r,"value"),x=re(o,n);function a(v){const{onUpdateValue:p,"onUpdate:value":R}=r;p&&P(p,v),R&&P(R,v),n.value=v,i(),m()}function c(v){const{value:p}=e;p&&(p.contains(v.relatedTarget)||h())}function V(v){const{value:p}=e;p&&(p.contains(v.relatedTarget)||d())}xe(se,{mergedClsPrefixRef:u,nameRef:Q(r,"name"),valueRef:x,disabledRef:s,mergedSizeRef:t,doUpdateValue:a});const F=ne("Radio",w,u),$=T(()=>{const{value:v}=t,{common:{cubicBezierEaseInOut:p},self:{buttonBorderColor:R,buttonBorderColorActive:A,buttonBorderRadius:N,buttonBoxShadow:O,buttonBoxShadowFocus:M,buttonBoxShadowHover:de,buttonColor:ue,buttonColorActive:ce,buttonTextColor:be,buttonTextColorActive:ve,buttonTextColorHover:he,opacityDisabled:pe,[H("buttonHeight",v)]:fe,[H("fontSize",v)]:me}}=l.value;return{"--n-font-size":me,"--n-bezier":p,"--n-button-border-color":R,"--n-button-border-color-active":A,"--n-button-border-radius":N,"--n-button-box-shadow":O,"--n-button-box-shadow-focus":M,"--n-button-box-shadow-hover":de,"--n-button-color":ue,"--n-button-color-active":ce,"--n-button-text-color":be,"--n-button-text-color-hover":he,"--n-button-text-color-active":ve,"--n-height":fe,"--n-opacity-disabled":pe}}),b=g?ie("radio-group",T(()=>t.value[0]),$,r):void 0;return{selfElRef:e,rtlEnabled:F,mergedClsPrefix:u,mergedValue:x,handleFocusout:V,handleFocusin:c,cssVars:g?void 0:$,themeClass:b==null?void 0:b.themeClass,onRender:b==null?void 0:b.onRender}},render(){var r;const{mergedValue:e,mergedClsPrefix:t,handleFocusin:s,handleFocusout:i}=this,{children:m,isButtonGroup:d}=Qe(Ae(Te(this)),e,t);return(r=this.onRender)===null||r===void 0||r.call(this),I("div",{onFocusin:s,onFocusout:i,ref:"selfElRef",class:[`${t}-radio-group`,this.rtlEnabled&&`${t}-radio-group--rtl`,this.themeClass,d&&`${t}-radio-group--button-group`],style:this.cssVars},m)}}),Xe={class:"settings-view"},Ye={key:0,class:"feedback error",role:"alert"},Ze={key:1,class:"loading-panel",role:"status"},eo={key:2,class:"empty-panel"},oo=["onSubmit"],to={class:"panel-heading"},ao={class:"setting-copy"},ro={class:"radio-options"},no={class:"radio-copy"},io={key:0},lo={key:0,class:"feedback error",role:"alert"},so={key:1,class:"feedback success",role:"status"},uo=J({__name:"SettingsView",setup(r){const e=ze(),t=we({}),s=U(""),i=Be({queryKey:["settings","schema"],queryFn:()=>ee.get("/setting/schema")}),m=T(()=>{var l;return((l=i.data.value)==null?void 0:l.apps)??[]});ke(m,l=>{Object.keys(t).forEach(n=>delete t[n]),l.forEach(n=>{t[n.app_name]=Object.fromEntries(n.settings.map(o=>[o.key,o.value]))})},{immediate:!0});const d=$e({mutationFn:l=>ee.post("/setting",{app_name:l.app_name,settings:{...t[l.app_name]}}),onMutate:()=>{s.value=""},onSuccess:async(l,n)=>{s.value=n.app_name,await e.invalidateQueries({queryKey:["settings","schema"]})}});function h(l,n){var o;return((o=t[l])==null?void 0:o[n.key])??n.default}function u(l,n,o){o!==null&&t[l]&&(t[l][n]=o)}function g(l,n){const o=h(l,n);return typeof o=="boolean"?String(Number(o)):o}function w(l){var n;return d.isPending.value&&((n=d.variables.value)==null?void 0:n.app_name)===l}return(l,n)=>(f(),S("div",Xe,[Y(Ve,{title:"团队设置",description:"配置团队级行为。设置项、输入类型和可选值均由服务端统一定义。"}),k(i).isError.value?(f(),S("p",Ye,C(k(Z)(k(i).error.value)),1)):k(i).isPending.value?(f(),S("div",Ze,"正在加载团队设置…")):m.value.length?(f(!0),S(L,{key:3},G(m.value,o=>{var x;return f(),S("form",{key:o.app_name,class:"settings-panel",onSubmit:_e(a=>k(d).mutate(o),["prevent"])},[y("header",to,[y("div",null,[y("p",null,C(o.app_name.toUpperCase()),1),y("h2",null,C(o.label),1),y("span",null,C(o.description),1)]),Y(Re,{type:"submit",loading:w(o.app_name),disabled:k(d).isPending.value},{default:q(()=>[ye(" 保存"+C(o.label)+"设置 ",1)]),_:2},1032,["loading","disabled"])]),(f(!0),S(L,null,G(o.settings,a=>(f(),S("section",{key:a.key,class:Ce(["setting-row",{"setting-row--stacked":a.control==="radio"}])},[y("div",ao,[y("h3",null,C(a.label),1),y("p",null,C(a.description),1),y("code",null,C(o.app_name)+"."+C(a.key),1)]),a.control==="switch"?(f(),E(k(Fe),{key:0,value:!!h(o.app_name,a),"aria-label":a.label,"onUpdate:value":c=>u(o.app_name,a.key,c)},null,8,["value","aria-label","onUpdate:value"])):a.control==="radio"?(f(),E(k(Je),{key:1,value:g(o.app_name,a),"aria-label":a.label,"onUpdate:value":c=>u(o.app_name,a.key,c)},{default:q(()=>[y("div",ro,[(f(!0),S(L,null,G(a.options??[],c=>(f(),E(k(qe),{key:String(c.value),value:c.value},{default:q(()=>[y("span",no,[y("strong",null,C(c.label),1),c.description?(f(),S("small",io,C(c.description),1)):K("",!0)])]),_:2},1032,["value"]))),128))])]),_:2},1032,["value","aria-label","onUpdate:value"])):a.control==="select"?(f(),E(k(Ne),{key:2,value:g(o.app_name,a),options:a.options??[],"aria-label":a.label,"onUpdate:value":c=>u(o.app_name,a.key,c)},null,8,["value","options","aria-label","onUpdate:value"])):a.control==="number"?(f(),E(k(Ee),{key:3,value:Number(h(o.app_name,a)),min:a.min,max:a.max,step:a.step,"aria-label":a.label,"onUpdate:value":c=>u(o.app_name,a.key,c)},null,8,["value","min","max","step","aria-label","onUpdate:value"])):(f(),E(k(Pe),{key:4,value:String(h(o.app_name,a)),maxlength:a.max_length,"aria-label":a.label,"onUpdate:value":c=>u(o.app_name,a.key,c)},null,8,["value","maxlength","aria-label","onUpdate:value"]))],2))),128)),k(d).isError.value&&((x=k(d).variables.value)==null?void 0:x.app_name)===o.app_name?(f(),S("p",lo,C(k(Z)(k(d).error.value)),1)):K("",!0),s.value===o.app_name?(f(),S("p",so,C(o.label)+"设置已保存。 ",1)):K("",!0)],40,oo)}),128)):(f(),S("div",eo,[...n[0]||(n[0]=[y("h2",null,"当前没有可配置项",-1),y("p",null,"应用登记团队设置后会自动显示在这里。",-1)])]))]))}}),Bo=Se(uo,[["__scopeId","data-v-0cf4b689"]]);export{Bo as default};
