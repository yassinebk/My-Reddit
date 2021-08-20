import { FormControl, FormErrorMessage, FormLabel } from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { useField } from 'formik';
import { formatWithValidation } from 'next/dist/shared/lib/utils';
import React, { InputHTMLAttributes } from 'react'

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    name:string
    placeholder: string,
    label:string
}



export const InputField: React.FC<InputFieldProps> = (props) => {
    const [field,{error}] = useField(props);
    return (
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
            <Input {...field} id={field.name} placeholder={props.placeholder} type={props.type} />
            {error ? <FormErrorMessage>{error}</FormErrorMessage>:null}
            </FormControl>
        );
}