import { useEffect, useCallback } from "react";

/**
 * 自定义对话框组件
 * 统一警告框和确认框的样式
 */
export function AlertDialog({ isOpen, title = "提示", message, onConfirm, confirmText = "确定" }) {
  const handleKeyDown = useCallback((event) => {
    if (event.key === "Enter" || event.key === "Escape") {
      onConfirm?.();
    }
  }, [onConfirm]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onConfirm}>
      <div className="dialog-content dialog-alert" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-icon alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="dialog-title">{title}</h3>
        </div>
        <div className="dialog-message">{message}</div>
        <div className="dialog-actions">
          <button className="dialog-btn primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ 
  isOpen, 
  title = "确认", 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "确定",
  cancelText = "取消",
  danger = false
}) {
  const handleKeyDown = useCallback((event) => {
    if (event.key === "Enter") {
      onConfirm?.();
    } else if (event.key === "Escape") {
      onCancel?.();
    }
  }, [onConfirm, onCancel]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content dialog-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className={`dialog-icon ${danger ? 'danger' : 'confirm'}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {danger ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
            </svg>
          </div>
          <h3 className="dialog-title">{title}</h3>
        </div>
        <div className="dialog-message">{message}</div>
        <div className="dialog-actions">
          <button className="dialog-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`dialog-btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * useDialog Hook
 * 提供便捷的对话框状态管理
 */
export function useDialog() {
  const [state, setState] = React.useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm'
    title: '提示',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = useCallback((message, title = '提示') => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        type: 'alert',
        title,
        message,
        onConfirm: () => {
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
      });
    });
  }, []);

  const showConfirm = useCallback((message, title = '确认', options = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        danger: options.danger,
        onConfirm: () => {
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const DialogComponent = useCallback(() => {
    if (!state.isOpen) return null;

    if (state.type === 'alert') {
      return (
        <AlertDialog
          isOpen={state.isOpen}
          title={state.title}
          message={state.message}
          onConfirm={state.onConfirm}
        />
      );
    }

    return (
      <ConfirmDialog
        isOpen={state.isOpen}
        title={state.title}
        message={state.message}
        onConfirm={state.onConfirm}
        onCancel={state.onCancel}
        danger={state.danger}
      />
    );
  }, [state]);

  return { showAlert, showConfirm, DialogComponent };
}

// 需要导入React
import React from "react";