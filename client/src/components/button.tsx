import { useButton, AriaButtonProps } from "@react-aria/button";
import { FocusRing } from "@react-aria/focus";
import { useRef } from "react";

export default function Button(props: AriaButtonProps & { secondary?: boolean; className?: string }) {
    let ref = useRef(null);
    let { buttonProps, isPressed } = useButton(props, ref);
    let { children, className, secondary } = props;

    return (
        <FocusRing focusRingClass="outline outline-1 outline-blue-400 outline-offset-2">
            <button
                {...buttonProps}
                className={` ${isPressed ? `-translate-x-px translate-y-px ${secondary ? "bg-red-800" : "bg-blue-800"}` : ""}
                flex flex-row gap-1 justify-center items-center ${
                    secondary ? "bg-red-600" : "bg-blue-600"
                } text-white font-semibold px-3 py-2 rounded w-fit h-11 disabled:bg-gray-700
                ${className ?? ""}`}
                ref={ref}>
                {children}
            </button>
        </FocusRing>
    );
}
