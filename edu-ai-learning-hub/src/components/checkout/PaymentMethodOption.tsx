import React from "react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PaymentMethodOptionProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export const PaymentMethodOption: React.FC<PaymentMethodOptionProps> = ({
  id,
  name,
  description,
  icon,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupItem value={id} id={id} />
      <Label
        htmlFor={id}
        className="flex flex-1 items-center space-x-3 cursor-pointer"
      >
        <div className="bg-primary/10 p-2 rounded-md">{icon}</div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </Label>
    </div>
  );
};
