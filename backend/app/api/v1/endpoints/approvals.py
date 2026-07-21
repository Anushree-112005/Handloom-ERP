from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.approval import ApprovalWorkflow
from app.schemas.approval import ApprovalCreate, ApprovalAction, ApprovalResponse
# Assuming a generic get_current_user exists, adapting based on standard structure
# If it's different in auth, it can be adjusted.
from app.api.v1.endpoints.auth import get_current_user
from app.models.employee import Employee

router = APIRouter()

@router.post("/", response_model=ApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_approval_request(
    request: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Create a new approval request for a given entity."""
    new_approval = ApprovalWorkflow(
        entity_type=request.entity_type,
        entity_id=request.entity_id,
        approval_type=request.approval_type,
        required_role=request.required_role,
        extra_data=request.extra_data or {},
        requested_by_id=current_user.id
    )
    db.add(new_approval)
    db.commit()
    db.refresh(new_approval)
    return new_approval

@router.get("/pending", response_model=List[ApprovalResponse])
def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Get all pending approvals relevant to the current user's role."""
    # Based on the user's designation or department, they might see different approvals.
    # For now, if required_role is provided, match with current_user.designation (or similar field)
    # Alternatively, admins might see all.
    query = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.status == "Pending")
    
    # Simple role check:
    if current_user.user_type != "Admin":
        if current_user.designation:
            query = query.filter(ApprovalWorkflow.required_role == current_user.designation)
            
    return query.all()

@router.post("/{approval_id}/action", response_model=ApprovalResponse)
def action_approval(
    approval_id: int,
    action_data: ApprovalAction,
    db: Session = Depends(get_db),
    current_user: Employee = Depends(get_current_user)
):
    """Approve or reject a pending approval."""
    approval = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
        
    if approval.status != "Pending":
        raise HTTPException(status_code=400, detail=f"Approval is already {approval.status}")
        
    if action_data.action not in ["Approve", "Reject"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'Approve' or 'Reject'")
        
    approval.status = "Approved" if action_data.action == "Approve" else "Rejected"
    approval.approved_by_id = current_user.id
    if action_data.comments:
        approval.comments = action_data.comments
    if action_data.extra_data:
        # Merge extra data
        approval.extra_data = {**approval.extra_data, **action_data.extra_data}
        
    db.commit()
    db.refresh(approval)
    
    # Ideally, trigger an event or callback here to update the underlying entity status
    # E.g., if entity_type == 'SalesInvoice', update the SalesInvoice status to 'Approved'
    
    return approval
