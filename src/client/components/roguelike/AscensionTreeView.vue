<template>
  <div class="ascension-tree-view">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :node-types="(nodeTypes as any)"
      :nodes-draggable="false"
      :nodes-connectable="false"
      :elements-selectable="false"
      :zoom-on-scroll="true"
      :pan-on-scroll="true"
      :min-zoom="0.45"
      :max-zoom="1.4"
      fit-view-on-init
      :fit-view-options="{padding: 0.2}"
      class="ascension-tree-view__canvas"
    >
      <Background pattern-color="#2a3344" :gap="18" :size="1" />
      <Controls
        :show-interactive="false"
        class="ascension-tree-view__controls"
      />
    </VueFlow>
  </div>
</template>

<script lang="ts">
import {defineComponent, markRaw, PropType} from 'vue';
import {VueFlow, MarkerType, Position} from '@vue-flow/core';
import {Background} from '@vue-flow/background';
import {Controls} from '@vue-flow/controls';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import AscensionTreeNode from '@/client/components/roguelike/AscensionTreeNode.vue';
import {buildAscensionFlowGraph} from '@/client/utils/AscensionFlowGraph';
import {AscensionNodeId} from '@/common/roguelike/AscensionTree';

export default defineComponent({
  name: 'AscensionTreeView',
  components: {
    VueFlow,
    Background,
    Controls,
    AscensionTreeNode,
  },
  props: {
    unlockedNodes: {
      type: Object as PropType<Set<AscensionNodeId>>,
      required: true,
    },
    availablePoints: {
      type: Number,
      required: true,
    },
  },
  emits: ['unlock'],
  data() {
    return {
      nodeTypes: {
        ascension: markRaw(AscensionTreeNode),
      } as const,
    };
  },
  computed: {
    flowGraph(): ReturnType<typeof buildAscensionFlowGraph> {
      return buildAscensionFlowGraph(undefined, this.unlockedNodes, this.availablePoints);
    },
    flowNodes() {
      return this.flowGraph.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onUnlock: this.onUnlock,
        },
      }));
    },
    flowEdges() {
      return this.flowGraph.edges.map((edge) => ({
        ...edge,
        animated: edge.data.active,
        style: {
          stroke: edge.data.active ? '#6ea8dc' : '#3a4a60',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edge.data.active ? '#6ea8dc' : '#3a4a60',
        },
        ...(edge.data.backward ?
          {sourcePosition: Position.Bottom, targetPosition: Position.Left} :
          {}),
      }));
    },
  },
  methods: {
    onUnlock(nodeId: string): void {
      this.$emit('unlock', nodeId);
    },
  },
});
</script>

<style scoped>
.ascension-tree-view {
  width: 100%;
  height: 620px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #2f3a4d;
  background: radial-gradient(circle at top, rgba(36, 48, 68, 0.55), rgba(12, 16, 24, 0.95));
}

.ascension-tree-view__canvas {
  width: 100%;
  height: 100%;
  background: transparent;
}

.ascension-tree-view :deep(.vue-flow__controls) {
  box-shadow: none;
  border: 1px solid #3a4a60;
  border-radius: 8px;
  overflow: hidden;
}

.ascension-tree-view :deep(.vue-flow__controls-button) {
  background: rgba(20, 26, 36, 0.95);
  border-bottom: 1px solid #2f3a4d;
  color: #c5d4ea;
  fill: #c5d4ea;
}

.ascension-tree-view :deep(.vue-flow__controls-button:hover) {
  background: rgba(34, 44, 60, 0.98);
}

.ascension-tree-view :deep(.vue-flow__edge-path) {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}
</style>
