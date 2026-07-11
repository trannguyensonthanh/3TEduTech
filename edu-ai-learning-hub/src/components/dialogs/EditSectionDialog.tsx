import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditSectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editSectionTitle: string;
  setEditSectionTitle: (title: string) => void;
  editSectionDescription: string;
  setEditSectionDescription: (description: string) => void;
  onSave: () => void;
}

const EditSectionDialog: React.FC<EditSectionDialogProps> = ({
  isOpen,
  onClose,
  editSectionTitle,
  setEditSectionTitle,
  editSectionDescription,
  setEditSectionDescription,
  onSave,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Section</DialogTitle>
          <DialogDescription>Update section details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-section-title">Section Title</Label>
            <Input
              id="edit-section-title"
              value={editSectionTitle}
              onChange={(e) => setEditSectionTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-section-description">
              Description (optional)
            </Label>
            <Textarea
              id="edit-section-description"
              value={editSectionDescription}
              onChange={(e) => setEditSectionDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSectionDialog;
