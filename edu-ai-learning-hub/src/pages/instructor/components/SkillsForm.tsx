// src/pages/instructor/components/SkillsForm.tsx
import { useState, useMemo } from 'react';
import {
  useMyInstructorProfile,
  useAddMySkill,
  useRemoveMySkill,
} from '@/hooks/queries/instructor.queries';
import { useSkills } from '@/hooks/queries/skill.queries';
import { Skill } from '@/services/skill.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common/Icons';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const SkillsForm = () => {
  const { data: profile, isLoading: isLoadingProfile } =
    useMyInstructorProfile();
  const { mutate: addSkill, isPending: isAdding } = useAddMySkill();
  const { mutate: removeSkill, isPending: isRemoving } = useRemoveMySkill();

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: allSkillsData, isLoading: isLoadingSkills } = useSkills({
    searchTerm,
    limit: 10,
  });

  const instructorSkillIds = useMemo(
    () => new Set(profile?.skills.map((s) => s.skillId)),
    [profile]
  );

  const availableSkills = useMemo(() => {
    return (
      allSkillsData?.skills.filter(
        (skill) => !instructorSkillIds.has(skill.skillId)
      ) || []
    );
  }, [allSkillsData, instructorSkillIds]);

  const handleAddSkill = (skillId: number) => {
    addSkill(skillId, {
      onSuccess: () => {
        toast.success('Skill added!');
        setOpen(false);
      },
      onError: (error) => toast.error(error.message || 'Failed to add skill.'),
    });
  };

  const handleRemoveSkill = (skillId: number) => {
    removeSkill(skillId, {
      onSuccess: () => toast.success('Skill removed!'),
      onError: (error) =>
        toast.error(error.message || 'Failed to remove skill.'),
    });
  };

  if (isLoadingProfile) {
    return (
      <div className='flex items-center justify-center py-10'>
        <Icons.spinner className='animate-spin h-6 w-6 mr-2 text-muted-foreground' />
        <span className='text-muted-foreground text-lg'>Loading skills...</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expertise & Skills</CardTitle>
        <CardDescription>
          Highlight your areas of expertise to attract the right students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex flex-wrap gap-2 mb-4 min-h-[40px]'>
          {profile?.skills.map((skill) => (
            <Badge
              key={skill.skillId}
              variant='secondary'
              className='text-sm py-1 px-3'
            >
              {skill.skillName}
              <button
                onClick={() => handleRemoveSkill(skill.skillId)}
                className='ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5 disabled:opacity-50'
                disabled={isRemoving}
              >
                <Icons.x className='h-3 w-3' />
              </button>
            </Badge>
          ))}
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant='outline' className='w-full sm:w-auto'>
              <Icons.plus className='mr-2 h-4 w-4' />
              Add Skill
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[300px] p-0' align='start'>
            <Command>
              <CommandInput
                placeholder='Search skills...'
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>
                  {isLoadingSkills ? 'Loading...' : 'No skills found.'}
                </CommandEmpty>
                <CommandGroup>
                  {availableSkills.map((skill: Skill) => (
                    <CommandItem
                      key={skill.skillId}
                      value={skill.skillName}
                      onSelect={() => handleAddSkill(skill.skillId)}
                      disabled={isAdding}
                    >
                      {skill.skillName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
};
