import React, { useState } from "react";
import { Modal, Stack, Flex, Text, CloseButton, ScrollArea, Button, TextInput, type ModalProps } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

// ... existing imports and code remain unchanged ...

const jsonPathToString = (path?: (string | number)[]) => {
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const updateNode = useGraph(state => state.updateNode);

  const [editMode, setEditMode] = useState(false);
  const [draftValue, setDraftValue] = useState<string>(String(nodeData?.text?.[0]?.value ?? ""));
  const [draftKey, setDraftKey] = useState<string>(String(nodeData?.text?.[0]?.key ?? ""));

  // update when nodeData changes
  React.useEffect(() => {
    setDraftValue(String(nodeData?.text?.[0]?.value ?? ""));
    setDraftKey(String(nodeData?.text?.[0]?.key ?? ""));
  }, [nodeData]);

  const handleEditClick = () => {
    setEditMode(true);
  };
  const handleSave = () => {
    if (!nodeData) return;
    updateNode(nodeData.id, {
      key: draftKey,
      value: draftValue,
    });
    setEditMode(false);
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
          <ScrollArea.Autosize mah={250} maw={600}>
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
              // Simple edit UI for key/value, you may want a richer form for more complex nodes
              <Stack>
                <TextInput
                  label="Key"
                  value={draftKey}
                  onChange={e => setDraftKey(e.currentTarget.value)}
                />
                <TextInput
                  label="Value"
                  value={draftValue}
                  onChange={e => setDraftValue(e.currentTarget.value)}
                />
                <Flex gap="sm">
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