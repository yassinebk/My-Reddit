import { FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { ComponentWithAs, Textarea } from "@chakra-ui/react";
import { useField } from 'formik';
import React, { InputHTMLAttributes } from 'react';

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    name:string
    placeholder: string,
    label:string
    textArea?:boolean
}



const InputField: React.FC<InputFieldProps> = (props) => {
    const [field,{error}] = useField(props);
    let InputOrTextArea : ComponentWithAs<any,any> = Input
    if (props.textArea)
        InputOrTextArea = Textarea;
    return (
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name} fontSize="xl">{props.label}</FormLabel>
            <InputOrTextArea {...field} id={field.name} placeholder={props.placeholder} type={props.type} />
            {error ? <FormErrorMessage fontSize="md" fontWeight="italic">{error}</FormErrorMessage>:null}
            </FormControl>
        );
}
export default InputField;