<template>
  <div
    class="ascension-node"
    :class="nodeClass"
  >
    <Handle type="target" :position="Position.Top" class="ascension-node__handle" />
    <div class="ascension-node__header">
      <span class="ascension-node__name">{{ tile.name }}</span>
      <span v-if="state.maxLevel > 1" class="ascension-node__level">
        {{ state.level }} / {{ state.maxLevel }}
      </span>
      <span v-else class="ascension-node__badge" :class="badgeClass">{{ typeLabel }}</span>
    </div>
    <div v-if="state.maxLevel > 1" class="ascension-node__badge-row">
      <span class="ascension-node__badge" :class="badgeClass">{{ typeLabel }}</span>
    </div>
    <div v-if="state.currentBonus" class="ascension-node__bonus">
      {{ state.currentBonus }}
    </div>
    <div v-if="state.nextDescription" class="ascension-node__next">
      {{ state.nextDescription }}
    </div>
    <div class="ascension-node__footer">
      <span v-if="state.nextCost !== undefined" class="ascension-node__cost">
        {{ state.nextCost }} pt{{ state.nextCost === 1 ? '' : 's' }}
      </span>
      <span v-else class="ascension-node__cost ascension-node__cost--empty">—</span>
      <button
        v-if="state.canUnlock"
        class="ascension-node__action"
        @click.stop="unlock"
      >
        {{ state.level > 0 ? 'Upgrade' : 'Unlock' }}
      </button>
      <span v-else-if="state.isMaxed" class="ascension-node__status ascension-node__status--maxed">Maxed</span>
      <span v-else class="ascension-node__status">Locked</span>
    </div>
    <Handle type="source" :position="Position.Bottom" class="ascension-node__handle" />
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {Handle, Position} from '@vue-flow/core';
import {AscensionDisplayTile, AscensionTileNodeState} from '@/common/roguelike/AscensionTreeDisplay';
import {AscensionNodeType} from '@/common/roguelike/AscensionTree';

export default defineComponent({
  name: 'AscensionTreeNode',
  components: {Handle},
  props: {
    data: {
      type: Object as PropType<{
        tile: AscensionDisplayTile;
        state: AscensionTileNodeState;
        onUnlock?: (nodeId: string) => void;
      }>,
      required: true,
    },
  },
  emits: ['unlock'],
  data() {
    return {Position};
  },
  computed: {
    tile(): AscensionDisplayTile {
      return this.data.tile;
    },
    state(): AscensionTileNodeState {
      return this.data.state;
    },
    typeLabel(): string {
      return this.tile.type === AscensionNodeType.DIFFICULTY ? 'Difficulty' : 'Buff';
    },
    badgeClass(): string {
      return this.tile.type === AscensionNodeType.DIFFICULTY ?
        'ascension-node__badge--difficulty' :
        'ascension-node__badge--buff';
    },
    nodeClass(): Record<string, boolean> {
      return {
        'ascension-node--maxed': this.state.isMaxed,
        'ascension-node--available': this.state.canUnlock,
        'ascension-node--owned': this.state.level > 0 && !this.state.isMaxed,
        'ascension-node--locked': this.state.level === 0 && !this.state.canUnlock,
      };
    },
  },
  methods: {
    unlock(): void {
      if (!this.state.nextNodeId) {
        return;
      }
      if (this.data.onUnlock) {
        this.data.onUnlock(this.state.nextNodeId);
      }
      this.$emit('unlock', this.state.nextNodeId);
    },
  },
});
</script>

<style scoped>
.ascension-node {
  width: 220px;
  min-height: 128px;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid #3d4a5c;
  background: linear-gradient(180deg, rgba(28, 34, 44, 0.98) 0%, rgba(18, 22, 30, 0.98) 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  color: #e8edf5;
  font-size: 13px;
  line-height: 1.35;
}

.ascension-node--available {
  border-color: #7eb8e8;
  box-shadow: 0 0 0 1px rgba(126, 184, 232, 0.25), 0 10px 28px rgba(0, 0, 0, 0.4);
}

.ascension-node--owned {
  border-color: #5f8f6a;
}

.ascension-node--maxed {
  border-color: #4f9b57;
  background: linear-gradient(180deg, rgba(24, 48, 32, 0.95) 0%, rgba(16, 28, 22, 0.95) 100%);
}

.ascension-node--locked {
  opacity: 0.82;
}

.ascension-node__handle {
  width: 8px;
  height: 8px;
  background: #7eb8e8;
  border: 2px solid #1a2030;
}

.ascension-node__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.ascension-node__name {
  font-weight: 700;
  font-size: 14px;
  color: #f4f7fb;
}

.ascension-node__level {
  color: #9aa8bc;
  font-size: 12px;
  white-space: nowrap;
}

.ascension-node__badge-row {
  margin-bottom: 8px;
}

.ascension-node__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ascension-node__badge--difficulty {
  background: rgba(190, 72, 72, 0.22);
  color: #f3a0a0;
}

.ascension-node__badge--buff {
  background: rgba(72, 132, 196, 0.22);
  color: #9fd0ff;
}

.ascension-node__bonus {
  color: #8fd49a;
  margin-bottom: 6px;
}

.ascension-node__next {
  color: #a7b4c7;
  margin-bottom: 10px;
  min-height: 36px;
}

.ascension-node__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ascension-node__cost {
  color: #9fd0ff;
  font-weight: 600;
}

.ascension-node__cost--empty {
  color: #66758a;
}

.ascension-node__action {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: #9fd0ff;
  color: #102030;
  font-weight: 700;
  cursor: pointer;
}

.ascension-node__action:hover {
  background: #b9e0ff;
}

.ascension-node__status {
  color: #66758a;
  font-size: 12px;
  font-weight: 600;
}

.ascension-node__status--maxed {
  color: #6fcf84;
}
</style>
