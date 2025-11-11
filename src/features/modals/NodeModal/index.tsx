import React, { useState } from "react";
import { Modal, Stack, Flex, Text, CloseButton, ScrollArea, Button, Textarea, TextInput, ColorInput, type ModalProps } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";
import useJson from "../../../store/useJson";

const jsonPathToString = (path?: (string | number)[]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const setJson = useJson(state => state.setJson);

  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);

  // Get the actual value from the JSON at this node's path
  const getNodeValue = () => {
    if (!nodeData?.path) return null;
    try {
      const jsonData = JSON.parse(useJson.getState().json);
      let current: any = jsonData;
      for (const key of nodeData.path) {
        current = current[key];
      }
      return current;
    } catch {
      return null;
    }
  };

  const handleEditClick = () => {
    const value = getNodeValue();
    setEditedData(JSON.parse(JSON.stringify(value))); // Deep clone
    setEditMode(true);
  };
  
  const handleSave = () => {
    if (!nodeData?.path || !editedData) return;
    
    try {
      const jsonData = JSON.parse(useJson.getState().json);
      let current: any = jsonData;
      
      // Navigate to parent
      for (let i = 0; i < nodeData.path.length - 1; i++) {
        current = current[nodeData.path[i]];
      }
      
      const lastKey = nodeData.path[nodeData.path.length - 1];
      current[lastKey] = editedData;
      
      setJson(JSON.stringify(jsonData, null, 2));
      setEditMode(false);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedFieldChange = (parent: string, field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const renderEditForm = () => {
    if (!editedData || typeof editedData !== 'object') {
      return (
        <Textarea
          label="Value"
          value={JSON.stringify(editedData, null, 2)}
          onChange={e => {
            try {
              setEditedData(JSON.parse(e.currentTarget.value));
            } catch {
              // Allow editing even if temporarily invalid
            }
          }}
          minRows={4}
          styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
        />
      );
    }

    // Check if this is a fruit object with the expected structure
    const isFruitObject = editedData.name && editedData.color && editedData.details && editedData.nutrients;

    if (isFruitObject) {
      return (
        <Stack gap="md">
          <TextInput
            label="Name"
            value={editedData.name || ''}
            onChange={e => handleFieldChange('name', e.currentTarget.value)}
          />
          <ColorInput
            label="Color"
            value={editedData.color || '#000000'}
            onChange={value => handleFieldChange('color', value)}
          />
          
          <Text size="sm" fw={500} mt="md">Details</Text>
          <Stack gap="xs" pl="md">
            <TextInput
              label="Type"
              value={editedData.details?.type || ''}
              onChange={e => handleNestedFieldChange('details', 'type', e.currentTarget.value)}
            />
            <TextInput
              label="Season"
              value={editedData.details?.season || ''}
              onChange={e => handleNestedFieldChange('details', 'season', e.currentTarget.value)}
            />
          </Stack>

          <Text size="sm" fw={500} mt="md">Nutrients</Text>
          <Stack gap="xs" pl="md">
            {Object.entries(editedData.nutrients || {}).map(([key, value]) => (
              <TextInput
                key={key}
                label={key}
                value={String(value)}
                onChange={e => handleNestedFieldChange('nutrients', key, e.currentTarget.value)}
              />
            ))}
          </Stack>
        </Stack>
      );
    }

    // For other objects, show JSON editor
    return (
      <Textarea
        label="Edit JSON"
        value={JSON.stringify(editedData, null, 2)}
        onChange={e => {
          try {
            setEditedData(JSON.parse(e.currentTarget.value));
          } catch {
            // Allow editing even if temporarily invalid
          }
        }}
        minRows={8}
        styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
      />
    );
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <CloseButton onClick={onClose} />
          </Flex>
          <ScrollArea.Autosize mah={450} maw={600}>
            {!editMode ? (
              <>
                <CodeHighlight
                  code={JSON.stringify(nodeData?.text ?? [], null, 2)}
                  miw={350}
                  maw={600}
                  language="json"
                  withCopyButton
                />
                <Button
                  color="green"
                  mt="xs"
                  onClick={handleEditClick}
                  style={{ alignSelf: "flex-end" }}
                >
                  Edit
                </Button>
              </>
            ) : (
              <Stack>
                {renderEditForm()}
                <Flex gap="sm" mt="md">
                  <Button color="green" onClick={handleSave}>Save</Button>
                  <Button variant="light" onClick={() => setEditMode(false)}>Cancel</Button>
                </Flex>
              </Stack>
            )}
          </ScrollArea.Autosize>
        </Stack>
        <Text fz="xs" fw={500}>
          JSON Path
        </Text>
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy to clipboard"
            copiedLabel="Copied to clipboard"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};