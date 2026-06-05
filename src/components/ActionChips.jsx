import React from 'react';

/**
 * ActionChips Component renders a list of action chips.
 * 
 * Styled according to specs:
 * - pill shape (rounded-full)
 * - background #EFF6FF (bg-[#EFF6FF])
 * - border #B5D4F4 (border-[#B5D4F4])
 * - text color #0C447C (text-[#0C447C])
 * - font 12px (text-xs)
 * 
 * @param {object} props
 * @param {Array<{label: string, actionId: string}>} props.actions - Actions list.
 * @param {function} props.onChipClick - Click handler(actionId, label).
 */
export const ActionChips = ({ actions, onChipClick }) => {
    if (!actions || actions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3 select-none">
            {actions.map((action, i) => (
                <button
                    key={i}
                    onClick={() => onChipClick(action.actionId, action.label)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EFF6FF] border border-[#B5D4F4] text-[#0C447C] hover:bg-[#DCEBFF] hover:border-[#8EBEF0] active:scale-[0.98] transition-all cursor-pointer font-sans"
                >
                    {action.label}
                </button>
            ))}
        </div>
    );
};

export default ActionChips;
