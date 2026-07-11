import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";

interface CopyableFieldProps {
  label: string;
  value: string;
}

export const CopyableField: React.FC<CopyableFieldProps> = ({
  label,
  value,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-1 mb-3">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="flex items-center border rounded-md p-2 bg-muted/30">
        <div className="flex-1 font-medium truncate">{value}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-8 w-8"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
