import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
  setResourceTitle: (title: string) => void;
  resourceType: "pdf" | "doc" | "zip" | "link";
  setResourceType: (type: "pdf" | "doc" | "zip" | "link") => void;
  resourceUrl: string;
  setResourceUrl: (url: string) => void;
  onAddResource: () => void;
}

const AddResourceDialog: React.FC<AddResourceDialogProps> = ({
  isOpen,
  onClose,
  resourceTitle,
  setResourceTitle,
  resourceType,
  setResourceType,
  resourceUrl,
  setResourceUrl,
  onAddResource,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Resource</DialogTitle>
          <DialogDescription>
            Add downloadable resources to this lesson
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="resource-title">Resource Title</Label>
            <Input
              id="resource-title"
              value={resourceTitle}
              onChange={(e) => setResourceTitle(e.target.value)}
              placeholder="e.g. Project Files"
            />
          </div>
          <div>
            <Label htmlFor="resource-type">Resource Type</Label>
            <Select
              value={resourceType}
              onValueChange={(value: "pdf" | "doc" | "zip" | "link") =>
                setResourceType(value)
              }
            >
              <SelectTrigger id="resource-type">
                <SelectValue placeholder="Select resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="doc">Document</SelectItem>
                <SelectItem value="zip">ZIP Archive</SelectItem>
                <SelectItem value="link">External Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="resource-url">Resource URL</Label>
            <Input
              id="resource-url"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="e.g. /resources/file.pdf or https://example.com/resource"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onAddResource}>Add Resource</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddResourceDialog;
