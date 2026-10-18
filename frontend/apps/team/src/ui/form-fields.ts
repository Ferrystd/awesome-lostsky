import { inject, type InjectionKey } from 'vue'

export const formFieldsKey: InjectionKey<boolean> = Symbol('lostsky-form-fields')
export const useFormFields = () => inject(formFieldsKey, false)
