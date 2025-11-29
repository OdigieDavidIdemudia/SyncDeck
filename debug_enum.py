from backend.models import TaskStatus
import enum

def debug_enum():
    print(f"TaskStatus members: {list(TaskStatus)}")
    print(f"TaskStatus.ONGOING value: {repr(TaskStatus.ONGOING.value)}")
    print(f"TaskStatus.ONGOING type: {type(TaskStatus.ONGOING.value)}")
    
    try:
        print("Testing lookup by value 'ongoing'...")
        item = TaskStatus("ongoing")
        print(f"Success: {item}")
    except ValueError as e:
        print(f"Failed lookup 'ongoing': {e}")

    try:
        print("Testing lookup by value 'ONGOING'...")
        item = TaskStatus("ONGOING")
        print(f"Success: {item}")
    except ValueError as e:
        print(f"Failed lookup 'ONGOING': {e}")

if __name__ == "__main__":
    debug_enum()
