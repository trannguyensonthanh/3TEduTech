import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

interface PublishCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  completionPercentage: number;
}

const PublishCourseDialog: React.FC<PublishCourseDialogProps> = ({
  isOpen,
  onClose,
  onPublish,
  completionPercentage,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Course</DialogTitle>
          <DialogDescription>
            Are you sure you want to publish this course? After publishing, it
            will be visible to all users.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {completionPercentage < 100 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                Warning: Not all lessons are published yet. It's recommended to
                publish all lessons before publishing the course.
              </AlertDescription>
            </Alert>
          )}
          <p>
            Publishing your course will make it available in the course catalog
            and allow students to enroll.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onPublish}>Publish Course</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishCourseDialog;
