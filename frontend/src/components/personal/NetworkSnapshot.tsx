import React from 'react';
import { ConnectionRequest } from '@/types/discovery';
import { Button } from '@/components/ui/Button';

interface NetworkSnapshotProps {
  requests: ConnectionRequest[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isLoading?: boolean;
}

export const NetworkSnapshot: React.FC<NetworkSnapshotProps> = ({
  requests,
  onAccept,
  onReject,
  isLoading,
}) => {
  if (requests.length === 0) {
    return (
      <div className="network-snapshot">
        <h3 className="network-snapshot__title">Connection Requests</h3>
        <p className="network-snapshot__empty">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="network-snapshot">
      <h3 className="network-snapshot__title">
        Connection Requests ({requests.length})
      </h3>
      
      <div className="network-snapshot__list">
        {requests.map((request) => (
          <div key={request.id} className="network-request">
            <div className="network-request__avatar">
              <div className="network-request__avatar-placeholder">
                {request.user.firstName[0]}{request.user.lastName[0]}
              </div>
            </div>
            
            <div className="network-request__info">
              <div className="network-request__name">
                {request.user.firstName} {request.user.lastName}
              </div>
              {request.user.headline && (
                <div className="network-request__headline">
                  {request.user.headline}
                </div>
              )}
              {request.user.mutualConnections && request.user.mutualConnections > 0 && (
                <div className="network-request__mutual">
                  {request.user.mutualConnections} mutual
                </div>
              )}
            </div>

            <div className="network-request__actions">
              <button
                className="network-request__action-btn network-request__action-btn--accept"
                onClick={() => onAccept(request.id)}
                disabled={isLoading}
              >
                Accept
              </button>
              <button
                className="network-request__action-btn network-request__action-btn--ignore"
                onClick={() => onReject(request.id)}
                disabled={isLoading}
              >
                Ignore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
